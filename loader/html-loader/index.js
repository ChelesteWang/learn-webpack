// import plugin
import { sourcesPlugin, minimizerPlugin } from "./plugins";
// import utils
import {
  pluginRunner,
  normalizeOptions,
  getImportCode,
  getModuleCode,
  getExportCode,
  defaultMinimizerOptions,
} from "./utils";

import schema from "./options.json";

// main function
export default async function loader(content) {
  const rawOptions = this.getOptions(schema);
  const options = normalizeOptions(rawOptions, this);

  // 是否进行预处理
  if (options.preprocessor) {
    // eslint-disable-next-line no-param-reassign
    content = await options.preprocessor(content, this);
  }

  const plugins = [];
  const errors = [];
  const imports = [];
  const replacements = [];

  // 根据 options 注册插件即是否启用某功能
  if (options.sources) {
    plugins.push(
      sourcesPlugin({
        sources: options.sources,
        resourcePath: this.resourcePath,
        context: this.context,
        imports,
        errors,
        replacements,
      })
    );
  }

  // 是否开启压缩
  if (options.minimize) {
    plugins.push(minimizerPlugin({ minimize: options.minimize, errors }));
  }

  // 执行将 html 转化为 js 模块
  const { html } = await pluginRunner(plugins).process(content);

  for (const error of errors) {
    this.emitError(error instanceof Error ? error : new Error(error));
  }

  // import part
  const importCode = getImportCode(html, this, imports, options);
  // module part
  const moduleCode = getModuleCode(html, replacements, options);
  // export part
  const exportCode = getExportCode(html, options);

  return `${importCode}${moduleCode}${exportCode}`;
}

export { defaultMinimizerOptions };
