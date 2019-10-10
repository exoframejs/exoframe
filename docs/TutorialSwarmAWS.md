# Tutorial: Deploy to AWS-based Swarm cluster with Exoframe

This tutorial will guide you through setup of Exoframe on basic AWS Docker Swarm cluster using EC2 instances.

## Requirements

This tutorial assumes you have the following things installed on your machine:

- [Docker](https://docs.docker.com/install/)
- [Docker-machine](https://docs.docker.com/machine/install-machine/)
- [AWS cli](https://docs.aws.amazon.com/cli/latest/userguide/installing.html)

## Step 1: Get AWS account & access key and secret

Before getting started, you'll need an AWS account.
If you don't have one, you can register for free at: https://aws.amazon.com/
Once registered, you can get your security credentials at: https://console.aws.amazon.com/iam/home?#security_credential

## Step 2: Setup AWS variables

Once you've gotten your account, you will need to setup local AWS credentials for AWS cli and Docker-machine to use.
You can either use credentials file, like so:

```sh
$ cat ~/.aws/credentials
[default]
aws_access_key_id =
aws_secret_access_key =
```

Or you can export these variables before going forward:

```sh
$ export AWS_ACCESS_KEY_ID=
$ export AWS_SECRET_ACCESS_KEY=
```

## Step 3: Create AWS security groups

Once AWS access is configured, you'll need to create new AWS security groups for Swarm master and worker nodes.
This is required to allow the nodes to communicate, and to allow Traefik on master to listen to external requests.
You can do it by execution the following commands (note the region and IP addresses used, adjust as needed):

```sh
# create new security groups for master and nodes
aws ec2 create-security-group --group-name "exo-swarm" --description "A Security Group for Docker Networking" --region us-east-1
aws ec2 create-security-group --group-name "exo-swarm-master" --description "A Security Group for Docker Swarm Master" --region us-east-1

# Permit SSH, required for Docker Machine
aws ec2 authorize-security-group-ingress --group-name "exo-swarm" --protocol tcp --port 22 --cidr 0.0.0.0/0  --region us-east-1
aws ec2 authorize-security-group-ingress --group-name "exo-swarm-master" --protocol tcp --port 22 --cidr 0.0.0.0/0  --region us-east-1

# Permit Docker API ports
aws ec2 authorize-security-group-ingress --group-name "exo-swarm" --protocol tcp --port 2376  --cidr 0.0.0.0/0  --region us-east-1
aws ec2 authorize-security-group-ingress --group-name "exo-swarm-master" --protocol tcp --port 2376  --cidr 0.0.0.0/0  --region us-east-1
aws ec2 authorize-security-group-ingress --group-name "exo-swarm" --protocol tcp --port 2377  --cidr 0.0.0.0/0  --region us-east-1
aws ec2 authorize-security-group-ingress --group-name "exo-swarm-master" --protocol tcp --port 2377  --cidr 0.0.0.0/0  --region us-east-1

# Permit Serf ports for discovery
aws ec2 authorize-security-group-ingress --group-name "exo-swarm" --protocol tcp --port 7946  --cidr 0.0.0.0/0  --region us-east-1
aws ec2 authorize-security-group-ingress --group-name "exo-swarm" --protocol udp --port 7946  --cidr 0.0.0.0/0  --region us-east-1
aws ec2 authorize-security-group-ingress --group-name "exo-swarm-master" --protocol tcp --port 7946  --cidr 0.0.0.0/0  --region us-east-1
aws ec2 authorize-security-group-ingress --group-name "exo-swarm-master" --protocol udp --port 7946  --cidr 0.0.0.0/0  --region us-east-1

# Permit VXLAN
aws ec2 authorize-security-group-ingress --group-name "exo-swarm" --protocol tcp --port 4789  --cidr 0.0.0.0/0  --region us-east-1
aws ec2 authorize-security-group-ingress --group-name "exo-swarm" --protocol udp --port 4789  --cidr 0.0.0.0/0  --region us-east-1
aws ec2 authorize-security-group-ingress --group-name "exo-swarm-master" --protocol tcp --port 4789  --cidr 0.0.0.0/0  --region us-east-1
aws ec2 authorize-security-group-ingress --group-name "exo-swarm-master" --protocol udp --port 4789  --cidr 0.0.0.0/0 --region us-east-1

# Permit HTTP/HTTPS access to master
aws ec2 authorize-security-group-ingress --group-name "exo-swarm-master" --protocol tcp --port 80  --cidr 0.0.0.0/0 --region us-east-1
aws ec2 authorize-security-group-ingress --group-name "exo-swarm-master" --protocol tcp --port 443  --cidr 0.0.0.0/0 --region us-east-1
```

## Step 4: Start three EC2 instances

Once security groups has been setup, you can use Docker-machine to create three EC2 instances - one swarm master and two swarm worker nodes (note region and type settings, adjust as needed):

```sh
# create master
$ docker-machine create --driver amazonec2 --amazonec2-region us-east-1 --amazonec2-security-group "exo-swarm-master" --amazonec2-instance-type t2.micro exo-master

# create workers
$ docker-machine create --driver amazonec2 --amazonec2-region us-east-1 --amazonec2-security-group "exo-swarm"  --amazonec2-instance-type t2.micro exo-node1
$ docker-machine create --driver amazonec2 --amazonec2-region us-east-1 --amazonec2-security-group "exo-swarm"  --amazonec2-instance-type t2.micro exo-node2
```

## Step 5: Configure Docker Swarm cluster

Once all the instances have been setup, you'll need to get the internal IP address of the swarm master.
You can do it by executing the following command:

```
$ docker-machine ssh exo-master ifconfig eth0
```

This will output a bunch of details about `eth0`, somewhere in the second row you should have the IP address. In my case it was `172.31.13.45`.

Once you've gotten that IP address, you'll need to instantiate swarm.
First, point your docker client to the swarm master:

```sh
$ eval $(docker-machine env exo-master)
```

After that you can initialize the Swarm mode using the IP address from before:

```sh
$ docker swarm init --advertise-addr 172.31.13.45
```

Executing this command should result in output containing join command for worker nodes, e.g.:

```sh
Swarm initialized: current node (rhxazjcchiu1r3gmy3w3fe370) is now a manager.

To add a worker to this swarm, run the following command:

    docker swarm join --token SWMTKN-1-23tahe431ze3z5d5j9tiuavz3gl9xvsp32glrznnskvb8acsft-4a1pdonpgg7v07rem7rgfvoiw 172.31.13.45:2377

To add a manager to this swarm, run 'docker swarm join-token manager' and follow the instructions.
```

Next, you'll need to run this command on both workers to join them to swarm.
This can be done by executing the following commands (make sure to use your own join command):

```sh
# join node1 to the swarm
$ eval $(docker-machine env exo-node1)
$ docker swarm join --token SWMTKN-1-23tahe431ze3z5d5j9tiuavz3gl9xvsp32glrznnskvb8acsft-4a1pdonpgg7v07rem7rgfvoiw 172.31.13.45:2377

# join node2 to the swarm
$ eval $(docker-machine env exo-node2)
$ docker swarm join --token SWMTKN-1-23tahe431ze3z5d5j9tiuavz3gl9xvsp32glrznnskvb8acsft-4a1pdonpgg7v07rem7rgfvoiw 172.31.13.45:2377

# you should see "This node joined a swarm as a worker." if the execution was successful
```

Finally, you need to verify that the Swarm cluster is actually created and running.
This can be done by executing the following commands:

```sh
$ eval $(docker-machine env exo-master)
$ docker node ls

# if everything was setup correctly, you should see something similar:
ID                            HOSTNAME            STATUS              AVAILABILITY        MANAGER STATUS
rhxazjcchiu1r3gmy3w3fe370 *   exo-master          Ready               Active              Leader
06i6kd4tf76amapbm1dbphmck     exo-node1           Ready               Active
acbwfuyi3oerv1mch7tlzl47v     exo-node2          Ready               Active
```

## Step 6: Configure and start Exoframe server

As the final step, you'll need to configure and start Exoframe server.
First, you'll need to create new folder that'll store basic Exoframe server config.
This can be done by executing the following commands:

```sh
# make sure you are currently pointing to exo-master docker
$ eval $(docker-machine env exo-master)

# create folder for exoframe config
$ docker-machine ssh exo-master mkdir -p /home/ubuntu/.exoframe

# enter exo-master via ssh and edit config file
$ docker-machine ssh exo-master
$ vim /home/ubuntu/.exoframe/server.config.yml
```

Once you've started editing server config, set the following variables:

```yaml
debug: false
swarm: true
```

Next, you can add any additional `authorized_keys` you want to use for Exoframe authentication:

```sh
$ vim /home/ubuntu/.ssh/authorized_keys
# add any keys you want to use to login into exoframe
```

Finally, you need to start Exoframe server.
This can be done by executing the following command (see [server docs](https://github.com/exoframejs/exoframe-server#exoframe-server) for more details on arguments):

```sh
# start server
$ docker service create \
  --mount type=bind,source=/var/run/docker.sock,target=/var/run/docker.sock \
  --mount type=bind,source=/home/ubuntu/.exoframe,target=/root/.exoframe \
  --mount type=bind,source=/home/ubuntu/.ssh/authorized_keys,target=/root/.ssh/authorized_keys,readonly \
  -e EXO_PRIVATE_KEY=your_private_key \
  --label traefik.enable=true \
  --label "traefik.http.routers.exoframe-server.rule=Host(\`exo.mydomain.com\`)"  \
  --label traefik.port=8080 \
  --constraint=node.role==manager \
  --name exoframe-server \
  exoframe/server:develop

# if everything was setup correctly, you should see something similar:
overall progress: 1 out of 1 tasks
1/1: running  [==================================================>]
verify: Service converged
```

You should now be able to access Exoframe server via `exo.mydomain.com` (or the domain you've passed during the setup phase).
Exoframe is ready to use and will deploy all your projects into the AWS Swarm cluster.
