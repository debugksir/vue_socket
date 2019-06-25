<template>
  <div class="box">
    <div class="header">
      <div class="header-arr" v-on:click="goBack">
        <img src="../assets/images/chat/i_back.png" alt class="img">
      </div>
      <div class="header-title">{{doctorName}}</div>
      <div class="header-arr"></div>
    </div>

    <div class="chat" ref="enda">
      <div class="sub-chat" ref="end">
        <div class="tip">由于不能面诊患者，无法全面了解病情，医生任何关于疾病的建议仅供参考，不能替代面对面的诊断。</div>
        <div v-for="item in data" :key="item.index">
          <div v-if="item.fromUser == userName" class="me">
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
    </div>

    <div class="footer">
      <div class="inputbox">
        <textarea class="input" v-model="inputValue" type="text" maxlength="200" placeholder="请用20-200字简要描述您的问题" @keyup.enter="sendData"></textarea>
      </div>
      <div class="send" v-on:click="sendData">发送</div>
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
      data: [],
      userCount: '',
      userName: '',
      password: '',
      inputValue: '',
      doctorName: '',
      docId: '',
      doctorAvatar: '',
    };
  },
  mounted() {
    // 读取数据
    // 用户端
    // username: 账户
    // password: 用户密码
    // nickname: 用户昵称
    // docName: 医生名称
    // docPhoto: 医生头像
    // docId: 医生Id
    // 医生端
    // username: 账户
    // password: 用户密码
    // docName: 医生名称
    // docPhoto: 医生头像
    // docId: 医生Id

    this.doctorName = this.$route.query.docName ? this.$route.query.docName : 'daifu1';
    let userCount = this.$route.query.username;
    if(!userCount) {
      // 读取缓存
      let localUser = localStorage.getItem('user_name');
      localUser = localUser ? localUser : '';
      if(localUser == '') {
        this.userCount = 'user' + Math.floor((Math.random()*1000000)+1);
        // 存入缓存
        localStorage.setItem('user_name', this.userCount);
      } else {
        this.userCount = localUser;
        // 渲染历史数据
        let localData = JSON.parse(localStorage.getItem(localUser));
        if(localData && this.doctorName in localData) {
          this.data = localData[this.doctorName] ;        
        }
      }
    }else {
      this.userCount = userCount;
      let localData = JSON.parse(localStorage.getItem(this.userCount));
      if(localData && this.doctorName in localData) {
        this.data = localData[this.doctorName] ;        
      }
      // this.data = JSON.parse(localStorage.getItem(this.userCount))[this.doctorName];
    }
    // this.userCount = this.$route.query.username ? this.$route.query.username : 'user' + Math.floor((Math.random()*1000000)+1); 
    this.userName = this.userCount; 
    // this.userName = this.$route.query.nickName ? this.$route.query.nickName : 'user' + Math.floor((Math.random()*1000000)+1);
    this.password = this.$route.query.password;
    this.doctorAvatar = this.$route.query.docPhoto ? this.$route.query.docPhoto : require('../assets/images/chat/my_avatar.png');
    this.docId = this.$route.query.docId ? this.$route.query.docId*1 : 1;
    // produc
    // let proData = {
    //   userCount: this.userCount,
    //   userName: this.userName,
    //   password: this.password,
    //   doctorName: this.doctorName,
    //   doctorAvatar: this.doctorAvatar,
    //   docId: this.docId
    // }
    // console.log('oData:', proData);
    console.log('login_connect:', {"username":this.userCount,"password": this.password,"docId": this.docId, "docName": encodeURI(this.doctorName)});
    this.sockets.subscribe('connect', () => {
        this.$socket.emit('login.event', {"username":this.userCount,"password": this.password,"docId": this.docId, "docName": encodeURI(this.doctorName)});
    });
    this.sockets.subscribe('login.event', () => {
        // console.log('user_login:', data);
        // this.doctorName = data.doctorUserName ? data.doctorUserName : 'daifu1';
    });
    this.sockets.subscribe('chat.event', (data) => {
      if(typeof(data) == 'string' && data.indexOf('不在线') != -1) {
      // 提示对方不在线
        Toast('专家目前不在线上');
        return;
      }
      this.dealData(data);
      console.log('user_chat', data);
    });
    this.sockets.subscribe('msg.event', (data) => {
      MessageBox.alert(data, '提示');
    }),
    this.sockets.subscribe('disconnect', () => {
        // nothing todo
    });
  },
  sockets: {
    // connect(data) {
    //   this.id = this.$socket.id;
    //   this.$socket.emit("login", 1); //监听connect事件
    // },
    // message(data) {
    // }
  },
  methods: {
    sendData: function() {
      if(this.inputValue.length == 0) {
        Toast('请输入内容');
        return;
      } 
      let reqData = {
        fromUser: this.userName,
        // toUser: this.doctorName,
        toUser: 'daifu1',
        message: this.inputValue
      };
      // console.log('userSendData:', reqData);
      this.dealData(reqData);
      this.inputValue = '';       
      this.$socket.emit('chat.event', reqData);
    },
    dealData(data) {
      // console.log('dealData:', data);
      let k_doctor = localStorage.getItem(this.userName);
      k_doctor = k_doctor ? k_doctor : '';
      if(k_doctor == '') {
          let tempObj = {};
          tempObj[this.doctorName] = [data];
          localStorage.setItem(this.userName, JSON.stringify(tempObj));
      }else {
          k_doctor = JSON.parse(k_doctor);
          if(this.doctorName in k_doctor) {
              k_doctor[this.doctorName].push(data);
          }else {
              k_doctor[this.doctorName] = [data];
          } 
          localStorage.setItem(this.userName, JSON.stringify(k_doctor));
      }
      this.data = JSON.parse(localStorage.getItem(this.userName))[this.doctorName];
      this.toEnd();
      // console.log('this.data', this.data);
    },
    toEnd: function() {
      setTimeout(() => {
        this.$refs.enda.scrollTop = this.$refs.enda.scrollHeight;
        // this.$refs.end.scrollIntoView(false);
      }, 100);
      // console.log('to end');
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
  position: relative;
  width: 100%;
  height: 100%;
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
