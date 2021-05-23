import Link from 'next/link';

export default function IntroHero() {
  return (
    <div className="flex flex-col bg-gray-800 p-4 pt-24 pb-24 items-center justify-center text-white">
      <div className="flex flex-col gap-3 max-w-xl">
        <div className="uppercase font-mono font-semibold text-gray-500 text-lg">Exoframe</div>

        <div className="text-5xl font-black">Simple one-command deployments</div>
        <div className="text-gray-400 pt-2">
          Exoframe makes simple self-hosted one-command deployments accessible to everyone. Free and open source.
        </div>

        <div className="pt-6">
          <Link href="/manual/install">
            <a className="text-white py-2 px-4 border border-transparent text-sm font-medium rounded-md bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              View installation instructions →
            </a>
          </Link>
        </div>
      </div>
    </div>
  );
}
