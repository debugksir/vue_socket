<template>
  <div class="box">
    <div class="header">
      <div class="header-arr" v-on:click="goBack">
        <img src="../assets/images/chat/i_back.png" alt class="img">
      </div>
      <div class="header-title">{{doctorInfo.nickname}}</div>
      <div class="header-arr"></div>
    </div>

    <mt-loadmore class="chat" :autoFill="false" :top-method="loadTop" :topAllLoaded="allLoaded" topPullText="下拉加载更多" ref="loadmore">
      <div class="sub-chat">
        <div class="tip">由于不能面诊患者，无法全面了解病情，医生任何关于疾病的建议仅供参考，不能替代面对面的诊断。</div>
        <div v-for="item in data" :key="item.index">
          <div v-if="item.fromUid == userInfo.id" class="me">
            <div class="me-content">{{item.message}}</div>
            <div class="avatar">
              <img src="../assets/images/chat/my_avatar.png" alt class="img">
            </div>
          </div>
          <div v-else class="you">
            <div class="avatar">
              <img :src="doctorAvatar" alt class="img">
            </div>
            <div class="you-content">{{item.message}}</div>
          </div>
        </div>
      </div>
    </mt-loadmore>

    <div class="footer">
      <div class="inputbox">
        <textarea class="input" v-model="inputValue" type="text" maxlength="200" placeholder="请用20-200字简要描述您的问题" @keyup.enter="sendData"></textarea>
      </div>
      <div class="send" v-on:click="sendData">发送</div>
    </div>
  </div>
</template>
<script>
import Vue from 'vue';
import { Toast, MessageBox, Indicator, Loadmore } from 'mint-ui';
Vue.component(Loadmore.name, Loadmore);
import axios from 'axios';
import socket from '../assets/socket.js';
let socket_url = localStorage.getItem('socket_url');
socket_url = socket_url ? socket_url : '';
if(socket_url == '') {
  socket(window.location.hostname, 9095);
} else {
  let temp_url = socket_url.split(':')[0];
  let temp_port = socket_url.split(':')[1];
  temp_port = temp_port ? temp_port : 9095;
  socket(socket_url, temp_port);
}
const date_sort = (key) => {
  return function (a, b) {
      return a[key] - b[key]
  }
}
const get_cookie = () => {
    var a = document.cookie.split(";");
    var o = {};
    for (var i = 0; i < a.length; i++){ //遍历cookie信息数组
        a[i] && (a[i] = a[i].replace(/(^\s*)|(\s*$)/g,''));
        //清除头部空格符
        var b = a[i].split("=");
        var c = b[1];
        c && (c = c.replace(/(^\s*)|(\s*$)/g,''));
        c = unescape(c);
        //如果c中不包含逗号（不是子cookie），直接把c作为cookie变量的值存入对象
        if(!/\,/gi.test(c)){
            o[b[0]] = b[1];
        }else{
            var d = c.split(",");
            for(var j=0; j<d.length; j++){
                var e = d[j].split(":");
                e[0] && (e[0] = e[0].replace(/(^\s*)|(\s*$)/g,''));
                o[e[0]] = e[1];
            }
        }
    }
    return o;
}

export default {
  name: "UserClient",
  data() {
    return {
      chat: {},
      userInfo: {},
      doctorInfo: {},
      chatInfo: {},
      data: [],
      password: '',
      inputValue: '',
      docId: '',
      page: 1,
      size: 10,
      allLoaded: false,

    };
  },
  mounted() {
    let hosUid = get_cookie().hosUid;
    console.log('cookie:', get_cookie())
    this.password = hosUid ? hosUid : 'user1';
    this.docId = this.$route.query.docId ? this.$route.query.docId*1 : 0;
    console.log('发送的登录信息:', {"docId": this.docId, "password": this.password});
    this.sockets.subscribe('connect', () => {
      this.$socket.emit('login.event', {"docId": this.docId, "password": this.password}, (res) => {
        console.log('登录返回的数据:', res);
        if(res.code == 1) {
          MessageBox.alert(res.message, '提示');
          return;
        }
        if(res.doctor && res.user) {
          // 登录成功
          this.doctorInfo = res.doctor;
          // 医生头像 todo
          this.doctorAvatar = res.doctor.poster ? res.doctor.poster : require('../assets/images/chat/my_avatar.png');
          this.userInfo = res.user;
          this.chatInfo = res.chat;
          // 获取历史记录
          this.reqHistory(this.toEnd);
        }
      });
    });
    this.sockets.subscribe('login.event', () => {
    });
    this.sockets.subscribe('chat.event', (data) => {
      if(typeof(data) == 'string' && data.indexOf('不在线') != -1) {
        Toast('专家目前不在线上');
        return;
      };
      // 收到医生消息后,处理消息队列
      this.dealData(data);
    });
    this.sockets.subscribe('msg.event', (data) => {
      MessageBox.alert(data, '提示');
    }),
    this.sockets.subscribe('disconnect', () => {
        // nothing todo
    });
  },
  // =================================================================================
  methods: {
    loadTop() {
      console.log('top load');
      if(this.allLoaded) {
        Toast('没有更多了');
        // return;
      }
      this.reqHistory();
      this.$refs.loadmore.onTopLoaded();
    },
    reqHistory(callback) {
      let history_url = `http://local.hospital.com:9093/consult/history_chat_message?hosUid=${this.password}&chatId=${this.chatInfo.id}&page=${this.page}&size=${this.size}`;
      // let history_url = `/consult/history_chat_message?hosUid=${this.password}&chatId=${this.chatInfo.id}&page=${this.page}&size=${this.size}`;
      Indicator.open();
      console.log('请求聊天记录')
      axios.get(history_url).then(res => {
        Indicator.close();
        console.log('hostory:', res);
        if(res.data.code == 0) {
          // 按照时间戳小=>大排序
          let sort_res = res.data.data.list.sort(date_sort('msgTime'));
          this.data = sort_res.concat(this.data);
          // 判断是否是最后一页
          if(res.data.data.isLastPage) {
            this.allLoaded = true;
          } else {
            this.page++;
          }
          if(callback) {
            callback();
          }
        }else {
          Toast('获取聊天记录异常')
        }
      })
    },
    sendData() {
      if(this.inputValue.length == 0) {
        Toast('请输入内容');
        return;
      }
      let reqData = {
        toUser: this.doctorInfo.id,
        message: this.inputValue,
        chatId: this.chatInfo.id,
      };
      console.log('发送的数据:', reqData);
      this.$socket.emit('chat.event', reqData, (res) => {
        console.log('发送消息回调数据:', res);
        if(res.code == 0) {
          // 发送成功后将数据插入到消息队列里, 并回到聊天底部this.toEnd();
          let tempobj = {};
          tempobj.fromUid = this.userInfo.id;
          tempobj.toUid = this.doctorInfo.id;
          tempobj.message = this.inputValue;
          this.dealData(tempobj, true);
        }else {
          // 发送失败后提示用户错误信息
          MessageBox.alert(res.message, '提示');
        }
      }); 
    },
    dealData(data, isMe=false) {
      if(isMe) {
        // 用户自己发的
        console.log('发出的信息:', data);
        this.data.push(data);
        this.inputValue = '';
      } else {
        // 是否是当前聊天的用户发的
        console.log('收到的信息:', data);
        let tempobj = {};
        tempobj.fromUid = data.fromUser;
        tempobj.toUid = data.toUser;
        tempobj.message = data.message;
        this.data.push(data);
      }
      this.toEnd();
    },
    toEnd: function() {
      setTimeout(() => {
        let scrollBox = document.querySelector('.mint-loadmore');
        scrollBox.scrollTop = scrollBox.scrollHeight;
        // scrollBox.scrollIntoView(false);
        // this.$refs.loadmore.scrollTop = this.$refs.loadmore.scrollHeight;
      }, 100);
    },
    goBack() {
        window.history.back(-1); 
    }
  }
};
</script>

<style scoped>
.box {
  position: relative;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  padding-top: 11.5vw;
  padding-bottom: 12vw;
  background-color: #f2f3f4;
}
.header {
  position: absolute;
  left: 0;
  top: 0;
  z-index: 9999;
  background-color: #fff;
  width: 100%;
  height: 11.5vw;
  box-sizing: border-box;
  padding: 0 4.7vw;
  border-bottom: 1px solid #e2e2e2;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
}
.header-arr {
  width: 4.8vw;
  height: 4.8vw;
}
.header-title {
  font-size: 4.8vw;
  color: #000;
}
.chat {
  width: 100%;
  height: 100%;
  background-color: #f2f3f4;
 
}
.sub-chat {
  width: 100%;
  box-sizing: border-box;
  padding: 4vw 4.7vw;
}
.tip {
  width: 100%;
  background-color: #fff;
  border: 1px solid #eee;
  border-radius: 1.5vw;
  box-sizing: border-box;
  padding: 2.8vw 3.2vw;
  color: #ff6600;
  font-size: 3.5vw;
  line-height: 5vw;
}
.me {
  width: 100%;
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  align-items: flex-start;
  margin-top: 6.4vw;
}

.me-content {
  position: relative;
  max-width: 56vw;
  background-color: #cce6ff;
  border: 1px solid #bed6ee;
  border-radius: 1.5vw;
  box-sizing: border-box;
  padding: 2.8vw 3.2vw;
  color: #333;
  font-size: 3.5vw;
  line-height: 5vw;
  margin-right: 3.8vw;
}
.me-content::after {
  content: "";
  position: absolute;
  width: 2.5vw;
  height: 2.5vw;
  transform: rotate(45deg);
  right: -1.5vw;
  top: 3.5vw;
  background-color: #cce6ff;
  border-right: 1px solid #bed6ee;
  border-top: 1px solid #bed6ee;
  z-index: 99;
}
.avatar {
  width: 10.8vw;
  height: 10.8vw;
  border-radius: 50%;
  overflow: hidden;
  line-height: 0;
  background-color: #44aeff;
}

.you {
  width: 100%;
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: flex-start;
  margin-top: 6.4vw;
}
.you-content {
  position: relative;
  max-width: 56vw;
  background-color: #fff;
  border: 1px solid #eee;
  border-radius: 1.5vw;
  box-sizing: border-box;
  padding: 2.8vw 3.2vw;
  color: #333;
  font-size: 3.5vw;
  line-height: 5vw;
  margin-left: 3.8vw;
}
.you-content::after {
  content: "";
  position: absolute;
  width: 2.5vw;
  height: 2.5vw;
  transform: rotate(45deg);
  left: -1.5vw;
  top: 3.5vw;
  background-color: #fff;
  border-left: 1px solid #eee;
  border-bottom: 1px solid #eee;
  z-index: 99;
}

.footer {
  position: absolute;
  bottom: 0;
  left: 0;
  z-index: 9999;
  width: 100%;
  height: 12vw;
  background-color: #fff;
  box-sizing: border-box;
  padding: 0 4.7vw;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
}
.inputbox {
  width: 73vw;
  height: 9vw;
  box-sizing: border-box;
  padding: 2.4vw;
  border-radius: 1vw;
  background-color: #f2f3f4;
  border: 1px solid #e2e2e2;
}
.input {
  width: 100%;
  height: 4.2vw;
  line-height: 4.2vw;
  font-family: "Microsoft YaHei";
  font-size: 3.7vw;
  color: #333;
  box-sizing: border-box;
  background-color: #f2f3f4;
  outline: none;
  border: none;
  resize:none;
}
.send {
  width: 16vw;
  height: 9vw;
  line-height: 9vw;
  text-align: center;
  background-color: #44aeff;
  font-size: 4.3vw;
  color: #f2f3f4;
  border-radius: 1vw;
  cursor: pointer;
  overflow: hidden;
}
</style>
