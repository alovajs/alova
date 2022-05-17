# Alova
New request library for MVVM such as Vue.js and React.js

## Features
1. react/vue hook请求支持
2. 静默请求
3. 离线提交
4. typescript支持
5. gzip 2kb

1. 请求后立即调用onSuccess  o
2. 如果失败了则push到存储，并触发循环调用请求
3. 添加事件处理器，可绑定silentRequest监听后台请求的处理结果  ×
4. 监听网络状态，网络正常才去发起请求，网络断开时直接push到存储
5. 网络从无到有时，触发循环调用请求，从有到无时，停止循环调用