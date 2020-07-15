const vtypes = {
  HTML: 'HTML',
  TEXT: 'TEXT'
}

const childrenTypes = {
  EMPTY: 'EMPTY', // 空
  SINGLE: 'SINGLE', // 一个
  MULTIPLE: 'MULTIPLE' // 多个
}

// 生成 虚拟dom
function createElement(type, props, children) {

  let vtype;
  if (typeof type === 'string') {
    vtype = vtypes.HTML
  } else {
    vtype = vtypes.TEXT
  }


  let childrenType;
  if (children === null) {
    childrenType = childrenTypes.EMPTY;
  } else if (Array.isArray(children)) {
    const len = children.length;
    if (len === 0) {
      childrenType = childrenTypes.EMPTY
    } else {
      childrenType = childrenTypes.MULTIPLE
    }
  } else {
    childrenType = childrenTypes.SINGLE;
    children = createTextNode(children + '')
  }

  // 返回虚拟dom
  return {
    vtype,
    type,
    key: props && props.key,
    props,
    children,
    childrenType,
    node: null
  }
}


// 实现渲染
function render(vnode, container) {

  // 获取上次生成的vnode，如果有的话肯定就是第二次渲染
  let prevVNode = container.vnode;
  if (prevVNode) {
    patch(prevVNode, vnode, container)
  } else {
    mount(vnode, container)
  }
  // 保存本次的虚拟dom到container， 便于下次虚拟dom改变 做对比
  container.vnode = vnode;
}

function mount(vnode, container, flagNode) {
  const { vtype } = vnode
  if (vtype === vtypes.HTML) {
    mountElement(vnode, container, flagNode);
  } else {
    mountText(vnode, container);
  }
}

function mountElement(vnode, container, flagNode) {
  const { type, props, vtype, children, childrenType } = vnode;

  // 创建这个节点
  const node = document.createElement(type);
  // 把真实节点放到虚拟node节点中，便于后面使用
  vnode.node = node;

  // 挂在属性

  if (props) {
    for (key in props) {
      patchData(node, key, null, props[key])
    }
  }

  // 根据子节点的childrenType 判断是一个还是多个子节点 依次mount
  if (childrenType === childrenTypes.SINGLE) {
    mount(children, node);
  } else if (childrenType === childrenTypes.MULTIPLE) {
    for (let i = 0; i < children.length; i++) {
      mount(children[i], node)
    }
  }

  // 将创建的节点 插入容器
  flagNode ? container.insertBefore(node, flagNode) : container.appendChild(node);

}


function mountText(vnode, container) {
  console.log(vnode)
  const node = document.createTextNode(vnode.children);
  vnode.node = node;
  container.appendChild(node)
}

// 创建文本节点
function createTextNode(text) {
  return {
    vtype: vtypes.TEXT,
    type: null,
    props: null,
    children: text,
    childrenType: childrenTypes.EMPTY,
    node: null
  }
}

function patchData(node, key, prevVal, nextVal) {
  switch (key) {
    case "style":
      // 节点加上新的style属性
      for (let k in nextVal) {
        node.style[k] = nextVal[k]
      }

      // 遍历旧的style属性 如果发现新的style属性不包含这个 就把这个属性制空
      for (let k in prevVal) {
        if (nextVal && !nextVal.hasOwnProperty(key)) {
          node.style[k] = ''
        }
      }
      break;

    case 'class':
      node.className = nextVal;
      break;
    default:
      if (key[0] === '@') {

        if (prevVal) {
          node.removeEventListener('click', prevVal)
        }
        if (nextVal) {
          node.addEventListener('click', nextVal)
        }

      } else if (nextVal === null) {
        node.removeAttribute(key, nextVal)

      } else {
        node.setAttribute(key, nextVal)
      }

  }
}


function patch(prevVNode, nextVnode, container) {

  // 判断vnode的vtype 是否相同
  // 如果相同就区分是text 还是html 分别对待
  // 如果不同直接替换

  if (prevVNode.vtype !== nextVnode.vtype) {
    replaceVnode(prevVNode, nextVnode, container)
  } else if (nextVnode.vtype === vtypes.TEXT) {
    patchText(prevVNode, nextVnode, container)
  } else if (nextVnode.vtype === vtypes.HTML) {
    patchElement(prevVNode, nextVnode, container)
  }
}

function replaceVnode(prevVNode, nextVnode, container) {

  // 删除老的节点

  container.removeChild(prevVNode.node)
  // 挂在新的节点
  mount(nextVnode, container)
}

function patchText(prevVNode, nextVnode) {
  const node = nextVnode.node = prevVNode.node;

  if (nextVnode.children !== prevVNode.children) {
    node.nodeValue = nextVnode.children
  }

}
function patchElement(prevVNode, nextVnode, container) {
  // 如果新旧节点 不同 或者key不同 直接替换
  if (prevVNode.type !== nextVnode.type || prevVNode.key !== nextVnode.key) {
    replaceVnode(prevVNode, nextVnode, container);
    return;
  }

  // 新旧节点相同  判断他们的属性
  const node = (nextVnode.node = prevVNode.node);
  const { props: prevProps } = prevVNode;
  const { props: nextProps } = nextVnode;

  if (nextProps) {
    for (let key in nextProps) {
      patchData(node, key, prevProps[key], nextProps[key])
    }
  }

  // 遍历老节点属性，如果新节点没有这个属性 那就是删除这个属性，直接设为null
  if (prevProps) {
    for (let key in prevProps) {
      let prevVal = prevProps[key];
      if (prevVal && !nextProps.hasOwnProperty(key)) {

        patchData(node, key, prevProps[key], null)
      }
    }
  }

  patchChildren(
    prevVNode.childrenType, // 老节点的子节点 类型
    nextVnode.childrenType, // 新节点的子节点 类型
    prevVNode.children, // 老节点的子节点
    nextVnode.children, // 新节点的子节点
    node
  )


}

function patchChildren(
  prevChildrenType, // 老节点的子节点 类型
  nextChildrenType, // 新节点的子节点 类型
  prevChildren, // 老节点的子节点
  nextChildren, // 新节点的子节点
  container
) {

// debugger

  switch (prevChildrenType) {
    case childrenTypes.EMPTY: // 老节点是空的

      switch (nextChildrenType) {
        case childrenTypes.EMPTY: // 新节点是空的 什么都不做

          break;
        case childrenTypes.SINGLE: // 新节点是单个 mount这个节点
          mount(nextChildren, container)
          break;
        case childrenTypes.MULTIPLE: // 新节点多个  遍历mount 多个节点
          for (let i = 0; i < nextChildren.length; i++) {
            mount(nextChildren[i], container)
          }
          break;
      }

      break;




    case childrenTypes.SINGLE: // 老节点是单个

      switch (nextChildrenType) {
        case childrenTypes.EMPTY: // 新节点是空的 删除老节点
          container.removeChild(prevChildren.node);
          break;
        case childrenTypes.SINGLE: // 新节点是单个 就去对比这个节点 patch
          patch(prevChildren, nextChildren, container)
          break;
        case childrenTypes.MULTIPLE: // 新节点多个 删除老节点 遍历mount 多个新节点
          container.removeChild(prevChildren.node);

          for (let i = 0; i < nextChildren.length; i++) {
            mount(nextChildren[i], container)
          }
          break;
      }
      break;





    case childrenTypes.MULTIPLE: // 老节点多个

      switch (nextChildrenType) {
        case childrenTypes.EMPTY: // 新节点是空的 遍历删除老节点

          for (let i = 0; i < prevChildren.length; i++) {
            container.removeChild(prevChildren[i].node);
          }
          
          break;

        case childrenTypes.SINGLE: // 新节点是单个 就去对比这个节点 patch
          for (let i = 0; i < prevChildren.length; i++) {
            container.removeChild(prevChildren[i].node);
          }
          mount(nextChildren, container)
          break;

        case childrenTypes.MULTIPLE: // 新节点多个 
         
          // abcd ----> dabef

          // dab 可以复用，但是要patch 他们属性，还要判断位置的移动
          let lastIndex = 0;
          for(let i = 0; i < nextChildren.length; i++) {
            let nextVnode = nextChildren[i];
            let find = false;
            for(let j = 0; j < prevChildren.length; j++) {
              let prevVnode = prevChildren[j]

              // 当新旧节点 的类型和key 相同时 可以服用
              if(prevVnode.type === nextVnode.type && prevVnode.key === nextVnode.key ) {

                find = true;
                // patch他们的属性
                patch(prevVnode, nextVnode, container);

                // 判断位置
                if(j < lastIndex) {
                  const flagNode = nextChildren[i-1].node.nextSibling;
                  container.insertBefore(prevVnode.node, flagNode);
                } else {
                  lastIndex = j;
                }
              }
            }

            // ef 新增 并且插入
            if(!find) {
              const flagNode = i === 0 ? prevChildren[0].node : nextChildren[i-1].node.nextSibling;
              mount(nextVnode, container, flagNode)
            }
          }

          

          // c 删除
          for(let i = 0; i < prevChildren.length; i++) {
            const prevVnode = prevChildren[i];
            const has = nextChildren.find( nextVnode => prevVnode.type === nextVnode.type && prevVnode.key === nextVnode.key )
            if (!has) {
              container.removeChild(prevVnode.node)
            }
          }
          
          break;
      }
      break;
  }
}