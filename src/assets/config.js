// const host = 'http://goods.key';
const host = 'https://goods.balei.com';

const config = {
    coupon: `${host}/coupon/index/`,  // {page}/?token=
    search: `${host}/coupon/search/`, // {keywords}/{page}/?token=
    list: `${host}/coupon/list/`, // {cid}/{page}/?token=
    nav: `${host}/coupon/cat/` // {number}/?token=
}

export default config;