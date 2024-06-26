import { Suspense, useEffect, useMemo, useState } from 'react';
import { networkStatus } from './api';
import { useEvent } from './helper';
import routes from './routes';

const formatActiveRoute = (category, title) => `${category.toLowerCase()}.${title.toLowerCase().replace(/\s/g, '_')}`;
const defaultPath = formatActiveRoute(routes[0].category, routes[0].items[0].title);
const fileSuffix = 'jsx';
const packageName = 'react';
function Layout() {
  const path = new URLSearchParams(location.search).get('path') || defaultPath;
  const [activeRoute, setActiveRoute] = useState(path);
  const [showMenu, setShowMenu] = useState(false);
  const ActiveView = useMemo(() => {
    const [activeCategory] = activeRoute.split('.');
    const targetCategory = routes.find(r => r.category.toLowerCase() === activeCategory);
    return targetCategory?.items.find(({ title }) => formatActiveRoute(targetCategory.category, title) === activeRoute);
  }, [activeRoute]);

  useEffect(() => {
    // popstate
    window.addEventListener('popstate', event => {
      console.log(event);
      const path = new URLSearchParams(location.search).get('path');
      setActiveRoute(path || defaultPath);
    });
  }, []);

  const handleMenuClick = (category, title) => {
    const routeFlag = formatActiveRoute(category, title);
    history.pushState({}, '', `?path=${routeFlag}`);
    setActiveRoute(routeFlag);
    setShowMenu(false);
  };

  const networkOptions = [
    { title: 'Online', value: 1 },
    { title: 'Unreliable Network', value: 2 },
    { title: 'Offline', value: 0 }
  ];

  const { ref: selectRef } = useEvent({
    'sl-change': ({ target }) => {
      setNetwork(target.value);
    }
  });
  const [network, setNetwork] = useState(networkStatus.value);
  useEffect(() => {
    networkStatus.value = network;
  }, [network]);
  return (
    <div className="flex flex-col md:flex-row md:max-w-[1440px] md:mx-auto h-full">
      <div
        className={`fixed top-0 left-[max(0px, calc(50% - 45rem))] z-20 bg-white h-full transition-transform duration-300 flex flex-col w-80 border-r-[1px] border-gray-300 py-8 px-4 md:translate-x-0 overflow-y-auto ${showMenu ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-row">
          <strong>Alova Demo</strong>
          <sl-badge
            class="ml-2"
            variant="primary"
            pill>
            {packageName}
          </sl-badge>
        </div>
        <div className="flex flex-row mt-4">
          <sl-button
            class="mr-2"
            variant="primary"
            outline
            href="https://github.com/alovajs/alova"
            target="_blank">
            <sl-icon
              slot="prefix"
              name="github"
              class="text-2xl"
            />
          </sl-button>
          <sl-button
            class="mr-2"
            variant="primary"
            href="https://x.com/alovajs"
            target="_blank"
            outline>
            <sl-icon
              slot="prefix"
              name="twitter-x"
              class="text-2xl"
            />
          </sl-button>
          <sl-button
            variant="primary"
            outline
            href="https://alova.js.org"
            target="_blank">
            <sl-icon
              slot="prefix"
              name="window"
              class="text-2xl"
            />
          </sl-button>
        </div>

        <div className="flex flex-col mt-8">
          {routes.map(route => (
            <div
              key={route.category}
              className="flex flex-col mb-8">
              <h4 className="font-bold mb-3">{route.category}</h4>
              <div className="flex flex-col border-l-[1px] border-gray-200">
                {route.items.map(item => (
                  <a
                    onClick={() => handleMenuClick(route.category, item.title)}
                    key={item.title}
                    className="pl-4 border-l-[1px] -ml-[1px] hover:border-blue-800 cursor-pointer my-2">
                    {item.title}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* mask */}
      <div
        className={`fixed top-0 left-0 w-[100vw] h-full z-10 bg-gray-800 bg-opacity-30 ${showMenu ? 'block' : 'hidden'}`}
        onClick={setShowMenu.bind(null, false)}></div>

      <div className="p-8 md:pl-96 flex flex-col flex-1">
        <sl-icon-button
          onClick={() => setShowMenu(true)}
          class="block md:hidden text-2xl"
          name="list"
          label="Edit"></sl-icon-button>
        <div className="flex flex-col mb-6 md:flex-row md:justify-between">
          <div className="flex flex-row items-center justify-between mb-2 md:justify-start">
            <h2 className="font-bold text-2xl mr-4">{ActiveView.title}</h2>
            <sl-select
              class="w-40"
              value={network}
              ref={selectRef}>
              {networkOptions.map(({ title, value }) => (
                <sl-option
                  key={value}
                  value={value}>
                  {title}
                </sl-option>
              ))}
            </sl-select>
          </div>

          <div className="rounded-full bg-slate-100 px-4 flex flex-row items-center justify-between">
            <span className="font-mono font-bold mr-2">
              file: src/views/{ActiveView.title.replace(/\s/g, '') + `.${fileSuffix}`}
            </span>
            <sl-icon-button
              name="github"
              href={`https://github.com/alovajs/alova/blob/next/examples/${packageName}/src/views/${ActiveView.title.replace(/\s/g, '')}.${fileSuffix}`}
              target="_blank"
              class="text-2xl hover:text-black cursor-pointer transition-colors"></sl-icon-button>
          </div>
        </div>
        <Suspense>
          <ActiveView.component />
        </Suspense>
      </div>
    </div>
  );
}

export default Layout;
