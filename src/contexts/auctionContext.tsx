import {createContext} from 'react';

let DB = {
  "bids":
  [
    {"account":"0xc8289f53c49dc9dfc040c4b25e391547dee25e6b","name":"Pizza","price":"216.00","img":"http://placeimg.com/640/480/nature"},
    {"account":"0xa9b0703d1debd7d8c251f597af5fb0fe518e5ad9","name":"Hat","price":"559.00","img":"http://placeimg.com/640/480/business"},
    {"account":"0x39ec1855c69e77fd549ffc7a89d8dc63b4b886db","name":"Pizza","price":"277.00","img":"http://placeimg.com/640/480/fashion"},
    {"account":"0x3175cb28db86e64b3d7fd1daa1e6b2ce65eaa79c","name":"Chair","price":"706.00","img":"http://placeimg.com/640/480/city"},
    {"account":"0xbfefc62ebcbc0e3cdcdd9d20389dc20d3645fa90","name":"Shoes","price":"871.00","img":"http://placeimg.com/640/480/people"},
    {"account":"0xb1d12d3e7fe9c9919f92a317e3b49efafa954eee","name":"Shirt","price":"821.00","img":"http://placeimg.com/640/480/fashion"},
    {"account":"0xcbfefd2bdf472bf392d4bfcfa4cd7fdeefd84fea","name":"Cheese","price":"821.00","img":"http://placeimg.com/640/480/business"},
    {"account":"0xebb7f5dc95b2b0fea4ea4a3fc697f12f268796e7","name":"Shoes","price":"355.00","img":"http://placeimg.com/640/480/food"},
    {"account":"0xdab762c9a3f5d10b1437fff4b24edffedd029acc","name":"Soap","price":"831.00","img":"http://placeimg.com/640/480/nightlife"},
    {"account":"0x6ff319e74c666d2d9af32ac12fe8ee97cc37759e","name":"Table","price":"198.00","img":"http://placeimg.com/640/480/food"},
    {"account":"0xd0bfa19a98b7db48db7acd1b50eadb50eacbb7ce","name":"Pizza","price":"364.00","img":"http://placeimg.com/640/480/cats"},
    {"account":"0xeed8fbf0dce7ed1e3b4d5e5de7fcbea1cfac9cf4","name":"Car","price":"946.00","img":"http://placeimg.com/640/480/nightlife"},
    {"account":"0xaac7a85400ff19c76d40d8b9cd1e770fb58682ba","name":"Soap","price":"420.00","img":"http://placeimg.com/640/480/fashion"}
  ]
}

export const AuctionContext = createContext(DB);