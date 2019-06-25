<template>
  <!-- 聊天界面 -->
  <div class="box">
    <div v-if="!showChat" class="sub-boxa">
        <div class="header">
            <div class="header-arr" v-on:click="goBack">
                <img src="../assets/images/chat/i_back.png" alt class="img">
            </div>
            <div class="header-title">图文咨询</div>
            <div class="header-arr"></div>
        </div>
        <mt-loadmore style="height:100%" v-if="userList.length > 0" :bottom-method="loadBottom_mail" :bottom-all-loaded="allLoaded_mail" bottomPullText="" ref="loadmore_mail">
          <div class="userlist">
            <div v-for="(item, idx) in userList" :key="item.index" v-on:click="toChat(idx)">
              <div class="user-item">
                  <div class="user-avatar"><img src="../assets/images/chat/my_avatar.png" alt="" class="img"></div>
                  <div class="user-msg">
                      <div class="user-name">
                        <span>{{item.phone}}</span>
                        <span :class="item.status == 1 ? 'online' : 'offline'">{{item.status == 1 ? '• 在线' : '• 离线'}}</span>
                      </div>
                      <div v-if="item.unread > 0" class="user-valumn">{{item.unread}}</div>
                  </div>
              </div>
            </div>
          </div>
        </mt-loadmore>
        <div v-else class="no-user">
          暂无用户加入聊天
        </div>
    </div>
    <div v-else class="sub-boxb">
        <div class="header">
            <div class="header-arr"  v-on:click="toList">
                <img src="../assets/images/chat/i_back.png" alt class="img">
            </div>
            <div class="header-title">{{currentUser.phone}}</div>
            <div class="header-arr"></div>
        </div>
        <mt-loadmore class="chat" :autoFill="false"  :top-method="loadTop" :topAllLoaded="allLoaded" topPullText="下拉加载更多" ref="loadmore">
          <div class="sub-chat" ref="enda">
            <div class="tip">由于不能面诊患者，无法全面了解病情，医生任何关于疾病的建议仅供参考，不能替代面对面的诊断。</div>
            <div v-for="item in data" :key="item.index">
              <div v-if="item.fromUid == doctorInfo.id" class="me">
                <div class="me-content">{{item.message}}</div>
                <div class="avatar">
                  <img :src="doctorAvatar" alt class="img">
                </div>
              </div>
              <div v-else class="you">
                <div class="avatar">
                  <img src="../assets/images/chat/my_avatar.png" alt class="img">
                </div>
                <div class="you-content">{{item.message}}</div>
              </div>
            </div>
          </div>
        </mt-loadmore>

        <div class="footer">
            <div class="inputbox">
                <textarea class="input" v-model="inputValue" type="text" placeholder="请输入回复内容" @keyup.enter="sendData"></textarea>
            </div>
            <div class="send" v-on:click="sendData">发送</div>
        </div>
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
  console.log('socket_url:', window.location.hostname, ':9095')
} else {
  let temp_url = socket_url.split(':')[0];
  let temp_port = socket_url.split(':')[1];
  temp_port = temp_port ? temp_port : 9095;
  socket(socket_url, temp_port);
  console.log('socket_url:', socket_url, ':', temp_port)
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
const uniarr = (arr) => {
  var hash = [];
  for (var i = 0; i < arr.length; i++) {
    for (var j = i + 1; j < arr.length; j++) {
      if (arr[i].id == arr[j].id) {
        ++i;
      }
    }
    hash.push(arr[i]);
  }
  return hash;
}

let orginUserList = [];
let onlineMembers = [];
export default {
  name: "UserClient",
  data() {
    return {
      doctorInfo: {},
      chatInfo: {},
      userList: [],
      showChat: false,
      data: [],
      inputValue: '',
      password: '',
      docId: '',
      page: 1,
      size: 10,
      page_mail: 1,
      size_mail: 20,
      currentUser: {},
      allLoaded_mail: false,
      allLoaded: false,
    };
  },
  mounted() {
    if (window.history && window.history.pushState) {
      history.pushState(null, null, document.URL);
      window.addEventListener('popstate', this.cancelGoback, false);
    }
    let hosUid = get_cookie().hosUid;
    console.log('cookie:', get_cookie())

    this.password = hosUid ? hosUid : 'doctor1';
    this.docId = this.$route.query.docId ? this.$route.query.docId*1 : 0;
    console.log('登录数据:', {"docId": this.docId, "password": this.password})
    this.sockets.subscribe('connect', () => {
      this.$socket.emit('login.event', {"docId": this.docId, "password": this.password}, (res) => {
        console.log('登录后返回的数据:', res);
        if(res.code == 1) {
          MessageBox.alert(res.message, '提示');
          return;
        }
        this.doctorInfo = res;
        this.doctorAvatar = res.poster ? res.poster : require('../assets/images/chat/my_avatar.png');
        
      });
    });
    this.sockets.subscribe('login.event', () => {});
    this.sockets.subscribe('room.members.event', (data) => {
      // 获取通讯录
      onlineMembers = data;
      this.reqMailList();
      console.log('room_member:', data);
    })
    this.sockets.subscribe('chat.event', (data) => {
      console.log('chat_event:', data);
      if(typeof(data) == 'string' && data.indexOf('不在线') != -1) {
        Toast('对方已离线');
        return;
      }
      this.dealData(data);
    });
    this.sockets.subscribe('join.event', (data) => {
      console.log('join:', data);
      this.dealJoin(data[0])
    });
    this.sockets.subscribe('leave.event', (data) => {
      // 提示对方不在线
      if(this.currentUser.userId !== undefined && data[0].userId === this.currentUser.userId) {
        Toast('对方已离线');
      }
      this.dealLeave(data[0]);
      console.log('leave:', data);
    });
    this.sockets.subscribe('msg.event', (data) => {
      MessageBox.alert(data, '提示');
    }),
    this.sockets.subscribe('disconnect', (data) => {
      console.log('disconnect:', data);
      MessageBox.alert('您的账号在另一设备登录或者已断开连接', '提示');
      this.showChat = false;
      orginUserList = [];
      this.userList = orginUserList;
    });
  },
  destroyed(){
    window.removeEventListener('popstate', this.cancelGoback, false);
  },
  // =================================================================================
  methods: {
      loadTop_mail() {
        console.log('top_mail load');
        this.$refs.loadmore_mail.onTopLoaded();
      },
      loadBottom_mail() {
        console.log('bottom_mail load');
        if(this.allLoaded_mail) {
          Toast('没有更多了');
          return;
        }
        this.reqMailList();
        this.$refs.loadmore_mail.onBottomLoaded();
      },
      loadTop() {
        console.log('top load');
        if(this.allLoaded) {
          Toast('没有更多了');
          return;
        }
        this.reqHistory();
        this.$refs.loadmore.onTopLoaded();
      },
      matchOnline() {
        // 去重
        onlineMembers = uniarr(onlineMembers);
        // 映射通讯录中的用户成在线状态
        for(let i = 0; i < orginUserList.length; i++) {
          orginUserList[i].status = 0;
          for(let j = 0; j < onlineMembers.length; j++) {
            if(orginUserList[i].userId == onlineMembers[j].id) {
              orginUserList[i].status = 1;
              break;
            }
          }
        }
        this.userList = orginUserList;
        console.log('match over:', this.userList)
      },
      // 获取通讯录
      reqMailList(callback) {
        let mail_url = `http://local.hospital.com:9093/consult/chat_list?hosUid=${this.password}&page=${this.page_mail}&size=${this.size_mail}`;
        // let mail_url = `/consult/chat_list?hosUid=${this.password}&page=${this.page_mail}&size=${this.size_mail}`;
        Indicator.open();
        axios.get(mail_url).then(res => {
          Indicator.close();
          console.log('mailList:', res);
          if(res.data.code == 0) {
            // 按照时间戳小=>大排序
            orginUserList = orginUserList.concat(res.data.data.list);
            console.log('userList:', orginUserList);
            // 判断是否是最后一页
            if(res.data.data.isLastPage) {
              this.allLoaded_mail = true;
            } else {
              this.page_mail++;
            }
            this.matchOnline();
            if(callback) {
              callback();
            }
          }else {
            Toast('获取聊天记录异常')
          }
        })
      },
      // 获取历史记录
      reqHistory(callback) {
        console.log('请求聊天记录')
        let history_url = `http://local.hospital.com:9093/consult/history_chat_message?hosUid=${this.password}&chatId=${this.currentUser.chatId}&page=${this.page}&size=${this.size}`;
        // let history_url = `/consult/history_chat_message?hosUid=${this.password}&chatId=${this.currentUser.chatId}&page=${this.page}&size=${this.size}`;
        Indicator.open();
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
      sendData: function() {
        if(this.inputValue.length == 0) {
            Toast('请输入内容') 
            return;
        } 
        let reqData = {
            toUser: this.currentUser.userId,
            message: this.inputValue,
            chatId: this.currentUser.chatId
        };
        console.log('发送的消息数据:', reqData);
        this.$socket.emit('chat.event', reqData, (res) => {
          console.log('发送消息回调数据:', res);
          if(res.code == 0) {
            // 发送成功后将数据插入到消息队列里, 并回到聊天底部this.toEnd();
            let tempobj = {};
            tempobj.fromUid = this.doctorInfo.id;
            tempobj.toUid = this.currentUser.userId,
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
          // 医生自己发的
          console.log('发出的信息:', data);
          this.data.push(data);
          this.inputValue = '';
        } else {
          // 是否是当前聊天的用户发的
          if(data.fromUser == this.currentUser.userId) {
            console.log('收到的信息:', data);
            // 清除角标
            // this.$socket.emit('read.event', {chatId: this.currentUser.chatId}, (res) => {
            //   console.log('清除角标:', res);
            //   if(res.code == 0) {
            //     this.userList[idx].unread = 0
            //   }
            // })
            let tempobj = {};
            tempobj.fromUid = data.fromUser;
            tempobj.toUid = data.toUser;
            tempobj.message = data.message;
            this.data.push(data);
          }else {
            for(let i = 0; i < orginUserList.length; i++) {
              if(orginUserList[i].userId == data.fromUser) {
                orginUserList[i].unread++
                this.userList = orginUserList;
                break;
              }
            }
          }
        }
        if(this.showChat) {
          this.toEnd();
        }
      },
      dealJoin(data) {
        //  判断通讯录中是否存在join用户
        let tempObj = {id: data.userId}
        onlineMembers.push(tempObj);
        for(let i = 0; i < this.userList.length; i++) {
          if(this.userList[i].userId == data.userId) {
            console.log('join 用户已存在通讯录')
            this.matchOnline();
            return;
          }
        }
        orginUserList.unshift(data);
        this.matchOnline();
        console.log('更新通讯录:', this.userList)
      },
      dealLeave(data) {
        // 用户离线, 更新离线用户状态
        for(let i = 0; i < onlineMembers.length; i++) {
          if(onlineMembers[i].id == data.userId) {
            onlineMembers.splice(i, 1)
            this.matchOnline();
            return;
          }
        }
      },
      toEnd: function() {
        setTimeout(() => {
          let scrollBox = document.querySelector('.mint-loadmore');
          scrollBox.scrollTop = scrollBox.scrollHeight;
          // scrollBox.scrollIntoView(false);
          // this.$refs.loadmore.scrollTop = this.$refs.loadmore.scrollHeight;
        }, 100);
      },
      toChat(idx) {
        this.showChat = true;
        this.currentUser = this.userList[idx];
        console.log('currentUser:', this.currentUser);
        // 清除角标
        this.$socket.emit('read.event', {chatId: this.currentUser.chatId}, (res) => {
          console.log('清除角标:', res);
          if(res.code == 0) {
            orginUserList[idx].unread = 0
            this.userList = orginUserList;
          }
        })
        // 获取用户聊天内容
        this.reqHistory()
        // 滑动到聊天底部 
        this.toEnd();
      },
      toList() {
        setTimeout(() => {
          let scrollBox = document.querySelector('.mint-loadmore');
          scrollBox.scrollTop = 0;
        }, 100);
        this.showChat = false;
        // 初始化聊天用户信息
        this.data = [];
        this.inputValue = '';
        this.currentUser = {};
        this.page = 1;
        this.allLoaded = false;
      },
      goBack() {
        window.history.back(-1); 
      },
      cancelGoback(){
        if(this.showChat)
          this.toList()
        else
          this.goBack()
      },
  }
};
</script>

<style scoped>
.online {
  margin-left: 2vw;
  font-size: 2vw;
  color: green;
}
.offline {
  margin-left: 2vw;
  font-size: 2vw;
  color: gray;
}
.no-user {
  width: 100%;
  height: 40vw;
  line-height: 40vw;
  text-align: center;
  font-size: 4.3vw;
  color: #666;
}
.userlist {
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    padding-left: 4.7vw;
}
.user-item {
    width: 100%;
    height: 16vw;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
}
.user-avatar {
    width: 10vw;
    height: 10vw;
    border-radius: 1.5vw;
    overflow: hidden;
}
.user-msg {
    width: 83vw;
    height: 16vw;
    box-sizing: border-box;
    padding-right: 4.7vw;
    border-bottom: 1px solid #e2e2e2;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
}
.user-name {
    font-size: 4.3vw;
    color: #222;
}
.user-valumn {
    height: 4.2vw;
    min-width: 4.2vw;
    border-radius: 2.1vw;
    overflow: hidden;
    line-height: 4.2vw;
    text-align: center;
    background-color: #fe3031;
    font-size: 3.2vw;
    color: #fff;
}

.box {
  position: relative;
  width: 100%;
  height: 100%;
}
.sub-boxa {
  position: relative;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  padding-top: 11.5vw;
  background-color: #fff;
}
.sub-boxb {
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  padding-top: 11.5vw;
  padding-bottom: 12vw;
  background-color: #fff;
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
  position: fixed;
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
