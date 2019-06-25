import Vue from 'vue';
import VueSocketIO from 'vue-socket.io';
// import socketIO from 'socket.io-client';


const socket = (host, port) => {
    // let temp = '139.199.1.207:9095';

    let url = host + ':' + port;
    Vue.use(new VueSocketIO({
        debug: true,
        // connection: socketIO(`http://172.2.0.137:9095?doc_id=${doc_id}`)
        connection: url
    }));
}

export default socket;