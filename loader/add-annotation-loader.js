// 实现一个可以给模块前添加指定注释

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