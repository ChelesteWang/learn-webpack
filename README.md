## webpack 打包过程

简单来看可以分为三部分，初始化阶段，打包执行阶段，文件输出阶段。

1.  **初始化配置：从配置文件和命令行语句中读取并合并参数，得出最终的参数**；
1.  **加载插件：用上一步得到的参数初始化 Compiler 对象，加载所有配置的插件，执行对象的 run 方法开始执行编译**；
1.  **确定入口：根据配置中的 entry 找出所有的入口文件**；
1.  **编译模块：从入口文件出发，对其依赖根据不同类型调用当前配置的 Loader 进行递归转移成可用模块。**；
1.  **完成模块编译：根据AST分析出依赖关系，得到了模块被转译后的最终内容**；
1.  **输出资源：根据入口和模块之间的依赖关系，组装成一个个包含多个模块的 Chunk，再把每个 Chunk 转换成一个单独的文件加入到输出列表**；
1.  **输出完成：在确定好输出内容后，根据配置确定输出的路径和文件名，把内容写入到产物文件**。

## webpack loader 和 plugin 作用

webpack loader 作用的作用是根据文件的类型使用不同的 loader 将其转译成可读取的模块。plugin 不同于 loader 可以执行更多类型的任务，可以应用在整个打包的编译生命周期中。webpack plugin 是一个具有 apply 方法的 JavaScript 对象。

## 编写 webpack loader 以及 plugin

先做一些准备工作

初始化一个项目

```shell
npm init -y
```

安装 webpack 以及 webpack-cli

```shell
npm install webpack webpack-cli -S -D
```

新建 webpack 打包配置

```js
const path = require("path");

module.exports = {
  entry: "./src/index.js",
  mode: "development",
  output: {
    filename: "main.js",
    path: path.resolve(__dirname, "dist"),
  },
};

```

尝试进行打包

```
npx webpack --config webpack.config.js 
```

### webpack loader 实现

loader 实现其实非常简单，我们可以把过程理解为流水线加工，将入口的输入经过转译处理获得新的输出，无论是纯字符串的拼接，还是像 babel-loader 需要修改 AST 对象，过程都是将原文件输出成可供使用的模块对象。

这里我们实现这样两个非常常见的 loader 即，添加注释和清除控制台输出

实现一个可以给模块前添加指定注释（包括作者和打包日期）

```js
module.exports = function (source) {
    const message =
        `
    /**
     * author : "ChelesteWang"
     * Date: ${new Date()}
     **/ 
    `
    return message + source
}
```

以上实现就是将预设字符串与代码进行拼接后返回

实现清除代码中 console.log()

```js
module.exports = function (source) {
  source = source.replace(new RegExp(/(console.log\()(.*)(\))/g), "");
  console.log(source);
  return source;
};

```

以上实现就是将 console.log 控制台输出语句通过正则表达式找出并替换为空字符串后返回。

修改一下 webpack 配置启用 loader 进行测试

```js
const path = require("path");

module.exports = {
  entry: "./src/index.js",
  mode: "development",
  output: {
    filename: "main.js",
    path: path.resolve(__dirname, "dist"),
  },
  module: {
    rules: [
      {
        test: /\.js/,
        use: [
          {
            loader: path.resolve(
              __dirname,
              "./loader/add-annotation-loader.js"
            ),
          },
          {
            loader: path.resolve(__dirname, "./loader/clear-console-loader.js"),
          },
        ],
      },
    ],
  },
};
```
对第一个 loader 进行改造一下实现可以自定义作者，这里就需要用到 options 了，以下为部分配置

```js
{
            loader: path.resolve(
              __dirname,
              "./loader/add-annotation-loader.js"
            ),
            options: {
              author: "ChelesteWang",
              date: new Date(),
            },
          },
```

于此同时也对 loader 进行修改

```
module.exports = function (source) {
    const message =
        `
    /**
     * author : "${this.getOptions().author}"
     * Date: ${this.getOptions().date}
     **/ 
    `
    return message + source
}
```
**注意事项**

于此同时我们还要注意一下 webpack loader 执行的顺序，正如上面所说 webpack loader 是一个对源码处理的流水线，以 use 数组的先后顺序进行转译处理，因此在很多时候需要注意顺序如 less-loader ，css-loader ， style-loader 的执行顺序

- less-loader：用于加载.less文件，将less转化为css
- css-loader：用于加载.css文件，将css转化为commonjs
- style-loader: 将样式通过 `<style>` 标签插入到header中

编写 loader 要遵循单一职责原则即，每一个 loader 只进行单一任务，因为 loader 可以被链式调用意味着不一定要输出 JavaScript。只要下一个 loader 可以处理这个输出，这个 loader 就可以返回任意类型的模块。此外还要保证 loader 函数的无状态以及幂等性即保证多次输入相同的内容产物一致。

### webpack plugin 实现

webpack plugin 可以理解为是用来是处理了编译生命周期的副作用，如 HtmlWepackPlugin 在转译结束后输出产物期间新建 HTML 并添加打包后 js 模块的入口。

我们下面实现一个简单的 webpack plugin ，一个在输出产物的过程中控制台输出一个 HelloWorld 。

```js
module.exports = class HelloWorldPlugin {
  apply(compiler) {
    compiler.hooks.done.tap(
      "Hello World Plugin",
      () => {
        console.log("Hello World!");
      }
    );
  }
};

```
还需要对其在配置中进行注册

```js
const path = require("path");

const HelloWorldPlugin = require("./plugin/hello-world-plugin");

module.exports = {
  entry: "./src/index.js",
  mode: "development",
  output: {
    filename: "main.js",
    path: path.resolve(__dirname, "dist"),
  },
  module: {
    rules: [
      {
        test: /\.js/,
        use: [
          {
            loader: path.resolve(
              __dirname,
              "./loader/add-annotation-loader.js"
            ),
            options: {
              author: "ChelesteWang",
              date: new Date(),
            },
          },
          {
            loader: path.resolve(__dirname, "./loader/clear-console-loader.js"),
          },
        ],
      },
    ],
  },
  plugins: [new HelloWorldPlugin()],
};

```

不同于 loader ，webpack plugin 需要导出一个带有 `apply` 方法的 class ，这个 `apply` 方法在安装插件时，会被 webpack compiler 调用一次。`apply` 方法可以接收一个 webpack compiler 对象的引用，从而可以在回调函数中访问到 compiler 对象。

使用 compiler.hooks 方法可以给编译期间的每一个生命周期绑定事件，从而实现插件的效果

![image.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/fc586a5f16954741a52e85ca5528a56f~tplv-k3u1fbpfcp-watermark.image?)

下面实现一个稍微复杂一点的插件，实现一个插件可以在执行结束后向 Assets 产物文件中新建一个 HTML 并调用 main.js

```js
module.exports = class {
  options;

  constructor(options) {
    this.options = options;
  }
  apply(compiler) {
    const { output, mode } = this.options;
    compiler.hooks.emit.tapAsync("Simple Html Plugin", (compilation, cb) => {
      const source =
        mode === "development" ? "" : compilation.assets[output].source();
      const src = mode === "development" ? `src='./${output}'` : "";
      compilation.assets["index.html"] = {
        source: function () {
          return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Document</title>
  </head>
  <body>
    <script ${src}>
          ${source}
    </script>
  </body>
</html>
          `;
        },
      };
      cb();
    });
  }
};
```

同样需要修改一下 webpack 的配置

```js
const path = require("path");

const HelloWorldPlugin = require("./plugin/hello-world-plugin");
const ListDepPlugin = require("./plugin/simple-html-plugin");

module.exports = {
  entry: "./src/index.js",
  mode: "development",
  output: {
    filename: "main.js",
    path: path.resolve(__dirname, "dist"),
  },
  module: {
    rules: [
      {
        test: /\.js/,
        use: [
          {
            loader: path.resolve(
              __dirname,
              "./loader/add-annotation-loader.js"
            ),
            options: {
              author: "ChelesteWang",
              date: new Date(),
            },
          },
          {
            loader: path.resolve(__dirname, "./loader/clear-console-loader.js"),
          },
        ],
      },
    ],
  },
  plugins: [new HelloWorldPlugin(), new ListDepPlugin({
    output:"main.js",
    mode:'development'
  })],
};
```

此插件代码仅供学习使用，代码功能实现较为简单，从中我们可以看到我们实现了打包后向产物中新建 html 并引入指定 js , 如果在生产环境就将代码注入到 script 标签中 , 如果是开发环境就用 src 引入的功能。

这个插件中我们使用了 `compiler.hooks.emit.tapAsync()` 这个勾子函数，`emit` 在生命周期中为 `AsyncHook` 因此需要使用 `tapAsync` 的方式调用，我们传入了两个参数一个是 ’Simple Html Plugin‘ 作为标识，另一个是回调函数，回调函数同样有两个参数 `compilation` , `cb` ，`cb` 顾名思义是我们异步函数传入的回调函数。需要进行调用，一个 `Compilation` 对象表现了当前的模块资源、编译生成资源、变化的文件、以及被跟踪依赖的状态信息，简单来讲就是把本次打包编译的内容存到内存里。`Compilation` 对象也提供了插件需要自定义功能的回调，以供插件做自定义处理时选择使用拓展。

总而言之一个 webpack plugin 基本包含以下几步：

1.  一个 JavaScript 函数或者类
1.  在函数原型（prototype）中定义一个注入`compiler`对象的`apply`方法。
1.  `apply`函数中通过`compiler`插入指定的事件钩子，在钩子回调中拿到`compilation`对象
1.  使用`compilation`操纵修改`webapack`内部实例数据。
1.  异步插件，数据处理完后使用`callback`回调

同样要注意一点 plugin 的注册顺序与调用顺序没有必然联系，主要在于插件挂载的不同生命周期。

**配套学习仓库**

[https://github.com/ChelesteWang/learn-webpack](https://github.com/ChelesteWang/learn-webpack)