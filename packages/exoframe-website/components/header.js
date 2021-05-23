import Logo from 'components/logo.js';
import Link from 'next/link';

const menuItems = [
  {
    link: '/manual',
    text: 'Manual',
  },
  {
    link: '/releases',
    text: 'Release notes',
  },
  {
    link: '/github',
    text: 'GitHub repo',
  },
];

export default function Header() {
  return (
    <nav className="bg-gray-800">
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
        <div className="relative flex items-center justify-between h-16">
          <div className="flex-1 flex items-center justify-center sm:items-stretch sm:justify-start">
            <div className="flex-shrink-0 flex items-center">
              <Logo className="h-8 w-auto" />
              <div className="font-bold text-white ml-1 hidden md:block items-center">Exoframe</div>
            </div>
            <div className="flex flex-1 hidden md:block" />
            <div className="hidden sm:block sm:ml-6">
              <div className="flex space-x-4">
                {menuItems.map((it) => (
                  <Link key={it.link} href={it.link}>
                    <a className="text-gray-300 px-3 py-2 rounded-md text-sm font-medium" aria-current="page">
                      {it.text}
                    </a>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="sm:hidden" id="mobile-menu">
        <div className="px-2 pt-2 pb-3 space-y-1">
          {menuItems.map((it) => (
            <Link key={it.link} href={it.link}>
              <a className="text-gray-300 block px-3 py-2 rounded-md text-base font-medium" aria-current="page">
                {it.text}
              </a>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
