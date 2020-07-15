# vdom

## createElement
createElement对传入的数据，返回虚拟dom
## render
render函数拿到虚拟dom和容器，首先会判断时第一次渲染还是数据改变再次渲染，分别处理。
## mount
mount函数 会把虚拟dom创建成真实dom，插入到容器中。
## patch
patch函数会比较旧的虚拟dom和新的虚拟dom，值更新改变的地方。
## patchData
patchData会对节点上的属性比较并修改
## patchChildren
patchChildren时对子节点的比较。根据新旧旧节点的变化情况进行增删改。
当子元素有多个时候，会选择性的使用旧的节点进行复用。

