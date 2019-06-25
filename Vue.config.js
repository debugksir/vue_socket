module.exports = {
    // 基本路径
    publicPath: 'chat/',
    outputDir: '../static/chat',
    // 生产环境是否生成 sourceMap 文件
    productionSourceMap: false,
    filenameHashing: true,
    // 服务器端口号
    devServer: {
        port: 1234,
    },
    css: {
        // 是否使用css分离插件 ExtractTextPlugin
        extract: false,
        // 开启 CSS source maps?
        sourceMap: false,
        // css预设器配置项
        loaderOptions: {},
        // 启用 CSS modules for all css / pre-processor files.
        modules: false
    },
    // assetsDir: '../static/chat/',
}