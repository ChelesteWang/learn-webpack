// 实现打包后向产物中新建 html 并引入指定 js , 如果在生产环境就将代码注入到 script 标签中 , 如果是开发环境就用 src 引入

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
