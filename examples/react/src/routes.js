import React from 'react';

export default [
  {
    category: 'Basics',
    items: [
      {
        title: 'Init Page',
        component: React.lazy(() => import('./views/InitPage'))
      },
      {
        title: 'Form Submit',
        component: React.lazy(() => import('./views/FormSubmit'))
      },
      {
        title: 'Condition Search',
        component: React.lazy(() => import('./views/ConditionSearch'))
      },
      {
        title: 'Shared Requests',
        component: React.lazy(() => import('./views/SharedRequests'))
      },
      {
        title: 'Old Data Placeholder',
        source: 'OldDataPlaceholder/index',
        component: React.lazy(() => import('./views/OldDataPlaceholder/index'))
      },
      {
        title: 'Update State Across Component',
        source: 'UpdateStateAcrossComponent/index',
        component: React.lazy(() => import('./views/UpdateStateAcrossComponent/index'))
      }
    ]
  },
  {
    category: 'Cache',
    items: [
      {
        title: 'Memory Cache',
        component: React.lazy(() => import('./views/MemoryCache'))
      },
      {
        title: 'Restore Cache',
        component: React.lazy(() => import('./views/RestoreCache'))
      },
      {
        title: 'Auto Invalidate Cache',
        component: React.lazy(() => import('./views/AutoInvalidateCache'))
      },
      {
        title: 'Cache With IndexedDB',
        component: React.lazy(() => import('./views/CacheWithIndexedDB'))
      }
    ]
  },
  {
    category: 'List',
    items: [
      {
        title: 'Paginated List',
        source: 'PaginatedList/index',
        component: React.lazy(() => import('./views/PaginatedList'))
      },
      {
        title: 'Load More List',
        source: 'LoadMoreList/index',
        component: React.lazy(() => import('./views/LoadMoreList'))
      }
    ]
  },
  {
    category: 'Optimistic Update',
    items: [
      {
        title: 'Settings',
        component: React.lazy(() => import('./views/Settings'))
      },
      {
        title: 'Simple List',
        source: 'SimpleList/index',
        component: React.lazy(() => import('./views/SimpleList/index'))
      },
      {
        title: 'Notes',
        source: 'Notes/index',
        component: React.lazy(() => import('./views/Notes/index'))
      }
    ]
  },
  {
    category: 'Token Authentication',
    items: [
      {
        title: 'Server Based',
        component: React.lazy(() => import('./views/ServerBased'))
      },
      {
        title: 'Client Based',
        component: React.lazy(() => import('./views/ClientBased'))
      }
    ]
  },
  {
    category: 'Other Strategies',
    items: [
      {
        title: 'Data Fetching',
        component: React.lazy(() => import('./views/DataFetching'))
      },
      {
        title: 'Form Hook',
        source: 'FormHook/index',
        component: React.lazy(() => import('./views/FormHook/index'))
      },
      {
        title: 'Auto Request',
        source: 'AutoRequest/index',
        component: React.lazy(() => import('./views/AutoRequest/index'))
      },
      {
        title: 'Send Captcha',
        component: React.lazy(() => import('./views/SendCaptcha'))
      },
      {
        title: 'Retriable Request',
        source: 'RetriableRequest/Implementation',
        component: React.lazy(() => import('./views/RetriableRequest/index'))
      },
      {
        title: 'Action Delegation',
        source: 'ActionDelegation/index',
        component: React.lazy(() => import('./views/ActionDelegation/index'))
      },
      {
        title: 'Serial Request',
        component: React.lazy(() => import('./views/SerialRequest'))
      }
    ]
  }
];
