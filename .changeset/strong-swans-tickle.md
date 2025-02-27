---
'@alova/mock': patch
---

对数组进行for in ，原型链上设置为可迭代的属性也会被循环，改为常规for循环避免这种情况
