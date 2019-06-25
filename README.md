# huainan_hospital

## Project setup
```
npm install
```

### Compiles and hot-reloads for development
```
npm run serve
```

### Compiles and minifies for production
```
npm run build
```

### Run your tests
```
npm run test
```

### Lints and fixes files
```
npm run lint
```

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).

## by ksir

### 自定义修改了mint-ui/style.css

```
start at p1083

.mint-loadmore {
    overflow: scroll;
}
.mint-loadmore-content {
    height: 100%;
}
.sub-chat {
    width: 100%;
    box-sizing: border-box;
    padding: 4vw 4.7vw;
}
.userlist {
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    padding-left: 4.7vw;
}
```

### 在mint-ui/mint-ui.common.js中添加了topAllLoad配置

```
start at p2867

topAllLoaded: {
    type: Boolean,
    default: false
}
start at p3027

if (this.direction === 'down'&& this.topAllLoaded) {
    return;
}
start at p3044
if (this.direction === 'down'&& this.topAllLoaded) {
    return;
}

start at p3091
if (this.direction === 'down'&& this.topAllLoaded) {
    this.topMethod();
    return;
}
```