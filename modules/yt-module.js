const
{ httpGetRaw } = require("./utilities.js"),

      
      

      
YT = {
  getUrls: (id) => {
    let infoUrl = `https://www.youtube.com/get_video_info?video_id=${id}&el=embedded&ps=default&eurl=&gl=US&hl=en`;
    
    var content = httpGetRaw(infoUrl);
    console.log(content);
  }
};

module.exports = {
  YT
}