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
