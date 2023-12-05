import Heading from '@theme/Heading';
import clsx from 'clsx';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  Svg: React.ComponentType<React.ComponentProps<'svg'>>;
  description: JSX.Element;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'Simple One-Command Deployment',
    Svg: require('@site/static/img/undraw_press_play_re_85bj.svg').default,
    description: (
      <>
        Deploying projects has never been easier. With Exoframe, a single command is all it takes to launch your
        projects seamlessly using Docker. Streamline your workflow and eliminate the complexities of deployment.
      </>
    ),
  },
  {
    title: 'Secure and Efficient Operations',
    Svg: require('@site/static/img/undraw_secure_server_re_8wsq.svg').default,
    description: (
      <>
        Familiar security with Exoframe's SSH key authentication and deploy tokens. Experience enhanced efficiency
        through automated optimizations like HTTPS and gzip compression.
      </>
    ),
  },
  {
    title: 'Streamlined Management and Updates',
    Svg: require('@site/static/img/undraw_detailed_examination_re_ieui.svg').default,
    description: (
      <>
        Simplify operations with Exoframe's user-friendly features. Easily access deployment logs, manage multiple
        endpoints, and execute straightforward updates for seamless project management.
      </>
    ),
  },
];

function Feature({ title, Svg, description }: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <Svg className={styles.featureSvg} role="img" />
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): JSX.Element {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
