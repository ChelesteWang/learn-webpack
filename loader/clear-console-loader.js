// 实现清除代码中 console.log()

module.exports = function (source) {
  source = source.replace(new RegExp(/(console.log\()(.*)(\))/g), "");
  console.log(source);
  return source;
};
