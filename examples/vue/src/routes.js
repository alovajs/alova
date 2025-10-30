export default [
  {
    category: 'Basics',
    items: [
      {
        title: 'Init Page',
        description:
          'Directly use the states returned by `useRequest` to view, these states will be automatically updated at the appropriate time',
        doc: 'getting-started/basic/combine-framework#automatically-manage-request-status',
        component: () => import('./views/InitPage')
      },
      {
        title: 'Form Submit',
        description: 'Manually submit form with `useRequest`',
        doc: 'getting-started/basic/combine-framework#submit-data',
        component: () => import('./views/FormSubmit')
      },
      {
        title: 'Condition Search',
        description: 'Need to query data? `useWatcher` allows you to automatically request when some states changes',
        doc: 'client/strategy/use-watcher',
        component: () => import('./views/ConditionSearch')
      },
      {
        title: 'Shared Requests',
        description:
          'Do you often waste two identical requests at the same time? Let them share one request by `Shared Request`!',
        doc: 'getting-started/basic/method#request-sharing',
        component: () => import('./views/SharedRequests')
      },
      {
        title: 'Old Data Placeholder',
        description:
          'You can use old data instead of spinner to make the experience better, try to reload page and it will not display the spinner when loading data.',
        doc: ['client/strategy/use-request#set-initial-data', 'client/in-depth/middleware'],
        source: ['OldDataPlaceholder/Approach1', 'OldDataPlaceholder/Approach2'],
        component: () => import('./views/OldDataPlaceholder')
      },
      {
        title: 'Update State Across Component',
        description: 'Update data across any component hierarchy',
        doc: ['client/in-depth/update-across-components', 'client/strategy/use-fetcher'],
        source: ['UpdateStateAcrossComponent/Approach1', 'UpdateStateAcrossComponent/Approach2'],
        component: () => import('./views/UpdateStateAcrossComponent')
      }
    ]
  },
  {
    category: 'Cache',
    items: [
      {
        title: 'Memory Cache',
        description: 'Cache response and re-use it in next request',
        doc: 'cache/mode#memory-mode-default',
        component: () => import('./views/MemoryCache')
      },
      {
        title: 'Restore Cache',
        description: 'You can persist response to prevent extra requst in some scenes',
        doc: 'cache/mode#restore-mode',
        component: () => import('./views/RestoreCache')
      },
      {
        title: 'Auto Invalidate Cache',
        description:
          'You can invalidate caches automatically by binding the source requests. In this case, the form submiting request will invalidate the item detailed cache',
        doc: 'cache/auto-invalidate',
        component: () => import('./views/AutoInvalidateCache')
      },
      {
        title: 'Cache With IndexedDB',
        description:
          'The caches are stored in memory default, but you can also custom the storing place such as `IndexedDB`, or custom manage the caches',
        doc: ['advanced/custom/storage-adapter', 'cache/controlled-cache'],
        source: ['CacheWithIndexedDB/Approach1', 'CacheWithIndexedDB/Approach2'],
        component: () => import('./views/CacheWithIndexedDB')
      }
    ]
  },
  {
    category: 'List',
    items: [
      {
        title: 'Paginated List',
        description:
          'The best pagination module which can improve fluency by 300%, and reduce coding difficulty by 50%, it provides fully list operating functions',
        source: 'PaginatedList/index',
        doc: 'client/strategy/use-pagination',
        component: () => import('./views/PaginatedList')
      },
      {
        title: 'Load More List',
        description:
          'The best pagination module which can improve fluency by 300%, and reduce coding difficulty by 50%, it provides fully list operating functions',
        source: 'LoadMoreList/index',
        doc: 'client/strategy/use-pagination',
        component: () => import('./views/LoadMoreList')
      }
    ]
  },
  {
    category: 'Optimistic Update',
    items: [
      {
        title: 'Settings',
        description: `Use the silent submission strategy, submit and respond immediately, greatly reducing the impact of network fluctuations, so that your application is still very smooth even when the network is unstable or even disconnected.

  Operation guide:
  1. Operate the setting item, it will generate feedback immediately without waiting for the server to respond;
  2. Switch the request mode and network status to experience the difference between them;`,
        doc: 'client/strategy/sensorless-data-interaction',
        component: () => import('./views/Settings')
      },
      {
        title: 'Simple List',
        description: `A simple list implemented using the silent submission strategy, which responds immediately after submission, greatly reduces the impact of network fluctuations, allowing your application to remain very smooth even when the network is unstable or even disconnected.

      Operation guide:
      1. Add, edit, and delete list items, it will response immediately without waiting for the server to respond;
      2. Switch the request mode and network status to experience the difference between them;`,
        source: 'SimpleList/index',
        doc: 'client/strategy/sensorless-data-interaction',
        component: () => import('./views/SimpleList')
      },
      {
        title: 'Notes',
        description: `A note application implemented using the silent submission strategy, which responds immediately after submission, greatly reduces the impact of network fluctuations, allowing your application to remain very smooth even when the network is unstable or even disconnected.

      Operation guide:
      1. Add, edit, and delete notes, it will response immediately without waiting for the server to respond;
      2. Switch the request mode and network status to experience the difference between them;`,
        source: 'Notes/index',
        doc: 'client/strategy/sensorless-data-interaction',
        component: () => import('./views/Notes')
      }
    ]
  },
  {
    category: 'Token Authentication',
    items: [
      {
        title: 'Server Based',
        description:
          'Token authentication interceptor provides unified management of token-based login, logout, token assignment, and token refresh, and supports silent token refresh.',
        doc: 'client/strategy/token-authentication',
        component: () => import('./views/ServerBased')
      },
      {
        title: 'Client Based',
        description:
          'Token authentication interceptor provides unified management of token-based login, logout, token assignment, and token refresh, and supports silent token refresh.',
        doc: 'client/strategy/token-authentication',
        component: () => import('./views/ClientBased')
      }
    ]
  },
  {
    category: 'Other Strategies',
    items: [
      {
        title: 'Data Fetching',
        description:
          'This is the demo that fetching the data of corresponding item when hovering items for 300ms. You can see the data immediately when you open this item',
        doc: 'client/strategy/use-fetcher',
        component: () => import('./views/DataFetching')
      },
      {
        title: 'Form Hook',
        description:
          'A hook designed for form submission. Through it, you can easily implement form drafts and multi-page (multi-step) forms. In addition, it also provides common functions such as form reset.',
        source: ['FormHook/StoreForm', 'FormHook/EditForm', 'FormHook/MultiForm', 'FormHook/ConditionFilter'],
        doc: 'client/strategy/use-form',
        component: () => import('./views/FormHook')
      },
      {
        title: 'Auto Request',
        description:
          'Automatically re-request data through browser events or polling, your users always see the newest data.',
        source: [
          'AutoRequest/Interval',
          'AutoRequest/Network',
          'AutoRequest/BrowserVisibility',
          'AutoRequest/PageFocus'
        ],
        doc: 'client/strategy/use-auto-request',
        component: () => import('./views/AutoRequest')
      },
      {
        title: 'Upload Files',
        description:
          'upload files, support a variant of types, such as File, Blob, base64, HTMLCanvasElement and ArrayBuffer',
        source: ['Uploader/SelectFile', 'Uploader/Canvas', 'Uploader/WithInput'],
        doc: 'client/strategy/use-uploader',
        component: () => import('./views/Uploader')
      },
      {
        title: 'Send Captcha',
        description: 'The Captcha sending strategy provides the automatic countdown and limit the sending frequency',
        doc: 'client/strategy/use-captcha',
        component: () => import('./views/SendCaptcha')
      },
      {
        title: 'Retriable Request',
        description:
          'Automatically retry failed request, you can use it for important requests. Custom your retry parameters.',
        source: 'RetriableRequest/Implementation',
        doc: 'client/strategy/use-retriable-request',
        component: () => import('./views/RetriableRequest')
      },
      {
        title: 'Action Delegation',
        description:
          'action delegation let you cast off the limitation of component hierarchy, trigger request within the target component at any place',
        source: ['ActionDelegation/Target', 'ActionDelegation/Controller'],
        doc: 'client/strategy/action-delegation-middleware',
        component: () => import('./views/ActionDelegation')
      },
      {
        title: 'Serial Request',
        description: 'An easier way to complete serial request with useHook',
        doc: 'client/strategy/use-serial-request',
        component: () => import('./views/SerialRequest')
      },
      {
        title: 'Server sent event',
        description: 'Receive real-time data from server via SSE(Server Sent Event) protocol, with `fetch` in sse',
        doc: 'client/strategy/use-sse',
        component: () => import('./views/SSE')
      }
    ]
  }
];
