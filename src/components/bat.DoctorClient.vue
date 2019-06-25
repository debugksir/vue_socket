<template>
  <!-- 聊天界面 -->
  <div class="box">
    <div v-if="!showChat">
        <div class="header">
            <div class="header-arr" v-on:click="goBack">
                <img src="../assets/images/chat/i_back.png" alt class="img">
            </div>
            <div class="header-title">图文咨询</div>
            <div class="header-arr"></div>
        </div>
        <div class="userlist">
            <div v-if="userList.length > 0">
              <div v-for="item in userList" :key="item.index" v-on:click="toChat(item.username)">
                <div class="user-item" v-if="item.username != doctorName">
                    <div class="user-avatar"><img src="../assets/images/chat/my_avatar.png" alt="" class="img"></div>
                    <div class="user-msg">
                        <div class="user-name">{{item.username}}</div>
                        <div v-if="item.unread > 0" class="user-valumn">{{item.unread}}</div>
                    </div>
                </div>
              </div>
            </div>
            <div v-else class="no-user">
              暂无用户加入聊天
            </div>
        </div>
    </div>
    <div v-else class="sub-box">
        <div class="header">
            <div class="header-arr" v-on:click="toList">
                <img src="../assets/images/chat/i_back.png" alt class="img">
            </div>
            <div class="header-title">{{userName}}</div>
            <div class="header-arr"></div>
        </div>
        <div class="chat" ref="enda">
            <div class="sub-chat">
              <div class="tip">由于不能面诊患者，无法全面了解病情，医生任何关于疾病的建议仅供参考，不能替代面对面的诊断。</div>
              <div v-for="item in data" :key="item.index">
                <div v-if="item.fromUser == doctorName" class="me">
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
        </div>
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
import { Toast, MessageBox } from 'mint-ui';
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

// socket();
export default {
  name: "UserClient",
  data() {
    return {
      userList: [],
      showChat: false,
      data: [],
      inputValue: '',
      userName: '',
      doctorCount: '',
      doctorName: '',
      password: '',
      docId: '',
      doctorAvatar: '',
    };
  },
  mounted() {
    // localStorage.clear();
    if (window.history && window.history.pushState) {
      history.pushState(null, null, document.URL);
      window.addEventListener('popstate', this.cancelGoback, false);
    }
    // 读取缓存数据
    let doctorCount = this.$route.query.username;
    if(!doctorCount) {
      // 读取缓存
      let localUser = localStorage.getItem('doctor_name');
      localUser = localUser ? localUser : '';
      if(localUser == '') {
        this.doctorCount = 'daifu1';
        // 存入缓存
        localStorage.setItem('doctor_name', this.doctorCount);
      } else {
        this.doctorCount = localUser;
      }
    }else {
      this.doctorCount = doctorCount;
    }
    // this.doctorCount = this.$route.query.username ? this.$route.query.username : 'daifu1';
    this.doctorName = this.doctorCount;
    // this.doctorName = this.$route.query.docName ? this.$route.query.docName : 'daifu' + Math.floor((Math.random()*1000000)+1);
    this.password = this.$route.query.password;
    this.doctorAvatar = this.$route.query.docPhoto ? this.$route.query.docPhoto : require('../assets/images/chat/my_avatar.png');
    this.docId = this.$route.query.docId ? this.$route.query.docId*1 : 1;
    // produc
    // let proData = {
    //   doctorCount: this.doctorCount,
    //   password: this.password,
    //   doctorName: this.doctorName,
    //   doctorAvatar: this.doctorAvatar,
    //   docId: this.docId
    // }
    // console.log('oData:', proData);
    console.log('login_event:', {"username": this.doctorCount,"password":this.password})
    this.sockets.subscribe('connect', () => {
        // console.log('login_event:', {"username": this.doctorCount,"password":this.password})
        this.$socket.emit('login.event', {"username": this.doctorCount,"password": this.password});
    });
    this.sockets.subscribe('login.event', () => {
        // console.log('login:', data);
        // this.doctorName = data.doctorUserName;
    });
    this.sockets.subscribe('chat.event', (data) => {
      console.log('chat_event:', typeof(data), data);
      if(typeof(data) == 'string' && data.indexOf('不在线') != -1) {
        // 提示对方不在线
        Toast('对方已离线');
        return;
      }
      this.dealData(data);
    });
    this.sockets.subscribe('join.event', (data) => {
      console.log('join:', data);
      this.dealJoin(data)
    });
    this.sockets.subscribe('leave.event', (data) => {
      // 提示对方不在线
      if(data[0].username == this.userName) {
        Toast('对方已离线');
      }
      this.dealLeave(data);
      console.log('leave:', data);
    });
    this.sockets.subscribe('msg.event', (data) => {
      MessageBox.alert(data, '提示');
    }),
    this.sockets.subscribe('disconnect', () => {
      console.log('disconnect:', data);
      MessageBox.alert('您的账号在另一设备登录或者已断开连接', '提示');
      this.showChat = false;
      this.userList = [];
    });
  },
  destroyed(){
    window.removeEventListener('popstate', this.cancelGoback, false);
  },
  methods: {
      sendData: function() {
        if(this.inputValue.length == 0) {
            Toast('请输入内容') 
            return;
        } 
        let reqData = {
            fromUser: this.doctorName,
            toUser: this.userName,
            message: this.inputValue
        };
        this.dealData(reqData, true); 
        this.inputValue = '';       
        this.$socket.emit('chat.event', reqData);
      },
      dealData(data, isMe) {
        let userName = '';
        if(isMe) {
          userName = this.userName;
        }else {
          userName = data.fromUser;
        }
        let k_doctor = localStorage.getItem(this.doctorName);
        k_doctor = k_doctor ? k_doctor : '';
        if(k_doctor == '') {
            let tempObj = {};
            tempObj[userName] = [data];
            localStorage.setItem(this.doctorName, JSON.stringify(tempObj));
        }else {
            k_doctor = JSON.parse(k_doctor);
            if(userName in k_doctor) {
                k_doctor[userName].push(data);
            }else {
                k_doctor[userName] = [data];
            } 
            localStorage.setItem(this.doctorName, JSON.stringify(k_doctor));
        }
        // 如果不是当前用户发消息,  添加角标
        // console.log('sendUser:', userName)
        // console.log('currentUser:', this.userName)
        if(userName != this.userName) {
          let tempUserList = this.userList;
          for(let i = 0; i < tempUserList.length; i++) {
            if(userName == tempUserList[i].username) {
              tempUserList[i].unread++;
            }
          }
          this.userList = tempUserList;
        } else {
          let localData = JSON.parse(localStorage.getItem(this.doctorName));
          if(localData && userName in localData) {
            this.data = localData[userName] ;        
          }
          // this.data = JSON.parse(localStorage.getItem(this.doctorName))[userName];
          if(this.showChat) {
            this.toEnd();
          }
        }
      },
      dealJoin(data) {
        // 添加角标标志
        for(let i = 0; i < data.length; i++) {
          data[i].unread = 0;
        }
        let allUser = this.userList.concat(data);
        this.userList = this.uniarr(allUser);
      },
      dealLeave(data) {
        this.userList = this.removeItem(data[0], this.userList);
      },
      removeItem(item, arr) {
        // 删掉指定元素
        for(let i = 0; i < arr.length; i++) {
          if(item.username == arr[i].username) {
            arr.splice(i, 1)
          }
        }
        return arr;
      },
      uniarr (arr) {
        // 去重
        var hash = [];
        for (var i = 0; i < arr.length; i++) {
          for (var j = i + 1; j < arr.length; j++) {
            if (arr[i].username == arr[j].username) {
              ++i;
            }
          }
          hash.push(arr[i]);
        }
        return hash;
      },
      toEnd: function() {
        setTimeout(() => {
          this.$refs.enda.scrollTop = this.$refs.enda.scrollHeight;
          // this.$refs.end.scrollIntoView(false);
        }, 100);
      },
      toChat(username) {
        this.showChat = true;
        // 设置用户聊天内容
        this.userName = username;
       
        let localData = JSON.parse(localStorage.getItem(this.doctorName));
        if(localData && username in localData) {
          this.data = localData[username] ;        
        }
        // this.data = JSON.parse(localStorage.getItem(this.doctorName))[username];
        // 清除当前用户角标 todo
        let tempUserList = this.userList;
        for(let i = 0; i < tempUserList.length; i++) {
          if(username == tempUserList[i].username) {
            tempUserList[i].unread = 0;
          }
        }
        this.userList = tempUserList;
        // 滑动到聊天底部 
        this.toEnd();
      },
      toList() {
        this.showChat = false;
        // 初始化聊天用户信息
        this.data = [];
        this.inputValue = '';
        this.userName = '';
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
  height: 100vh;
  box-sizing: border-box;
  padding-top: 11.5vw;
  padding-bottom: 12vw;
  background-color: #fff;
}
.sub-box {
  width: 100%;
  height: 100%;
  box-sizing: border-box;
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
  overflow: scroll;
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
  overflow: hidden;
}
</style>
