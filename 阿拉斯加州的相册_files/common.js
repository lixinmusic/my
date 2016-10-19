/* lyricPlayer **********************************/
var lyricPlayer = {
  // play status
  LOADING: 'loading', // 加载中
  LOADED: 'loaded', // 加载完成
  DISCARD: 'discard', // 丢弃
  PLAY:'running', // 播放中
  PAUSE:'paused', // 暂停
  NONE:'none', // 无状态

  // property
  _lyricArr:[],
  _author: '',
  _song:'',
  _album:'',
  _lyricMaxCount: 0,
  _lryicShowCount:0, // 显示的函数,在 playNextLyric 重置,然后没播放完一个歌词行 _lryicShowCount 减 1, _lryicShowCount 为 0 时候播放下一歌词.

  // play info
  _isShow:true,
  _curLineIdx:0,
  _lyricItemArr:undefined,
  _lyricItem:[], // li 节点

  // funtion
  init:function(){
    this._lyricItemArr = $(".lyricBar ul");
    this._playStatus = this.NONE;
    var viewW = this._lyricItemArr[0].offsetWidth;
    this._lyricMaxCount = Math.floor(viewW / parseInt($(".lyricBar").css('font-size')));
  },

  loadLyric:function(url){
    this.reset();
    this._playStatus = this.LOADING;

    $.ajax({
      url: url,
      type: 'GET',
      dataType: 'text',
      crossDomain: true,
      error: function (xhr, status) {
        console.log("error");
        console.log(status);
        lyricPlayer.reset();
      },
      success: function(data) {
        if(lyricPlayer._playStatus == lyricPlayer.DISCARD) {
          return;
        }

        lyricPlayer.paserLyric(data);

        if(lyricPlayer._playStatus == lyricPlayer.LOADING) {
          lyricPlayer._playStatus = lyricPlayer.LOADED;
        } else if(lyricPlayer._playStatus == lyricPlayer.LOADED) {
          lyricPlayer.start();
        }
      },
    });
  },

  paserLyric:function(lyric){
    this.reset();
    var lrcArr = lyric.split("\n");
    for (var i = 0, l = lrcArr.length; i < l; i++) {
        var time = lrcArr[i].match(/\[[0-9:.]*\]/g);
        if(time) {
          var lrc = lrcArr[i].substr(lrcArr[i].lastIndexOf(']')+1).replace(/^\s*|\s*$/g, "");
          for(var tIdx=0,tLen=time.length;tIdx<tLen;++tIdx){
            var t = time[tIdx].substr(1,time[tIdx].length-2).split(":");
            var lrcLine = {
              time: Math.floor((parseInt(t[0]) * 60 + parseFloat(t[1])) * 1000),
              lrc : lrc,
            }
            this._lyricArr.push(lrcLine);
          }
        } else {
          var regexp = /\[(.*?):(.*?)\]/g;
          var tag = regexp.exec(lrcArr[i]);
          if(tag) {
            switch(tag[1]) {
            case 'ar':
              this._author = tag[2];
              break;
            case 'al': 
              this._album = tag[2];
              break;
            case 'ti':
              this._song = tag[2];
              break;
            }
          }
        }
    }
    this._lyricArr.sort(function (a,b){
      return a.time - b.time;
    });
  },

  discard:function(){
    this._playStatus = this.DISCARD;
    this.reset();
  },

  replay: function() {
    this._curLineIdx = 0;
    this._lyricItemArr[0].innerHTML = "";
    this._playStatus = this.PLAY;
    this.playNextLyric();
  },

  reset: function() {
    this._lyricArr.length = 0;
    this._author = '';
    this._album = '';
    this._song = '';
    this._curLineIdx = 0;
    this._lyricItemArr[0].innerHTML = "";
    this._lryicShowCount = 0;
  },

  playNextLyric: function() {
    if(!this._lyricItemArr) {
      return;
    }

    var preLyric = this._lyricArr[this._curLineIdx-1],
        newLyric = this._lyricArr[this._curLineIdx++],
        nextLyric = this._lyricArr[this._curLineIdx];

    if(!newLyric){
      console.log('lyric end');
      return;
    } else if(!nextLyric){
      this._playStatus = this.LOADED;
      console.log('last lyric');
    }

    var lyric = newLyric.lrc;
    this._lryicShowCount = Math.floor(newLyric.lrc.length / this._lyricMaxCount) + (newLyric.lrc.length % this._lyricMaxCount == 0 ? 0 : 1);

    if(this._lryicShowCount == 0) {
      this._lryicShowCount = 1;
    }

    // 回收节点
    var liItemList = this._lyricItemArr[0].children;
    for (var i = liItemList.length - 1; i >= 0; i--) {
      this._lyricItem.push($(liItemList[i]));
    };

    this._lyricItemArr[0].innerHTML = "";

    // 动画时间
    var t = newLyric.time;

    if(nextLyric) {
      t = nextLyric.time - t;
    } else {
      t -= preLyric.time;
    }

    // 时间校正
    var tDes = Math.floor(musicView.audioPlayer._audio.currentTime * 1000) - newLyric.time;
    if(tDes > 100 || tDes < -100) {
      t -= tDes;
      if(t <= 0) {
        t = 300;
      }
    }

    t = Math.floor(t / lyric.length);
    var animateName = 'StretchleftIn'+(this._curLineIdx % 2)+' ';
    var delayTime = (this._lyricMaxCount * t) / 1000;

    if(this._isShow) {
      if(lyric == '#wait#') {
        $(".lyricBar").css('visibility','hidden');
      } else {
        $(".lyricBar").css('visibility','visible');
      }
    }

    for(var idx = 0;idx < this._lryicShowCount; ++idx) {
      var lyricVal = lyric.substr(this._lyricMaxCount * idx,this._lyricMaxCount);
      var v = animateName + (Math.floor(t * lyricVal.length) / 1000) +'s linear ' + (delayTime * idx) + 's';

      if(this._lyricItem.length > 0) {
        // 有节点则重新利用节点
        var liItem = this._lyricItem.pop();
        var spanItem = $(liItem[0].children[0]);
        var maskItem = $(spanItem[0].children[0]);

        spanItem.text(lyricVal);
        maskItem.text(lyricVal);
        spanItem.append(maskItem);

        this._lyricItemArr.append(liItem);
      } else {
        // 没有则创建节点
        var liItem = $('<li></li>');
        var spanItem = $('<span>'+ lyricVal +'</span>');
        var maskItem = $('<span class="lyricMask">'+ lyricVal +'</span>');

        maskItem.bind('oanimationend animationend webkitAnimationEnd',
          (function(mask){
            return function() {
              mask.css('width','100%');
              if(--lyricPlayer._lryicShowCount <= 0) {
                lyricPlayer.playNextLyric();
              }
            }
        })(maskItem));

        spanItem.append(maskItem);
        liItem.append(spanItem);
        this._lyricItemArr.append(liItem);
      }

      maskItem.css({
        'width':'0%',
        '-webkit-animation':v,
        'animation':v,
      });
    }
  },

  start: function() {
    if(this._playStatus == this.LOADING) {
      console.log('wait lyric!');
      this._playStatus = this.LOADED;
      return;
    } else if(this._playStatus == this.LOADED) {
      if(this._lyricArr.length > 0) {
        this.replay();
      }
      this.pause(this.PLAY);
    }
  },

  pause: function(status) {
    if(!this._lyricItemArr) {
      return;
    }

    if(this._playStatus == this.PLAY || this._playStatus == this.PAUSE) {
      if(status) {
        this._playStatus = status;
      } else {
        if(this._playStatus == this.PLAY) {
          this._playStatus = this.PAUSE;
        } else {
          this._playStatus = this.PLAY;
        }
      }

      this._lyricItemArr.find('.lyricMask').css({
        '-webkit-animation-play-state': this._playStatus,
        '-moz-animation-play-state': this._playStatus,
        '-o-animation-play-state': this._playStatus,
        'animation-play-state': this._playStatus,
      });
    }
  },

  show: function() {
    if(this._lyricItemArr) {
      $(".lyricBar").css('visibility','visible');
    }
    this._isShow = true;
  },

  hide: function(){
    if(this._lyricItemArr) {
      $(".lyricBar").css('visibility','hidden');
    }
    this._isShow = false;
  }
}

/* musicView **********************************/
var musicView = {
  chooseIdx : 0,
  audioPlayer : undefined,
  musicViewElem: undefined, 

  init : function () {
    this.musicViewElem = $('#MusicView');
    // 初始化音乐
    var musicItem;
  
    if(mvCfg.musictype == "user"){
       musicItem=$('#UserMusicItem'+mvCfg.music);
    }else{
      musicItem = $('#MusicItem'+mvCfg.music);
    }
    
    var musicBtn = $('#AudioBtn');

    if(musicItem.length > 0) {
      //歌词加载
      var lyricUrl = musicItem.eq(0).find('.musicStatus').data('lyric');
      if(lyricUrl.length > 0) {
        lyricPlayer.loadLyric(lyricUrl);
      }

      // 音乐加载
      this.audioPlayer = new Player(musicBtn,
        musicItem.eq(0).find('.musicStatus').data('info'),
        function(){lyricPlayer.start();});

      this.audioPlayer.isPlay = false;
      this.audioPlayer._play();
      this.chooseIdx = mvCfg.music;

      if(mvCfg.lyric) {
        musicItem.addClass('lyric');
        lyricPlayer.show();
      } else {
        lyricPlayer.hide();
      }

      musicItem.addClass('select');
    }

    this.musicViewElem = $('#MusicView');

    musicBtn.on('click', function () {
      if(musicBtn.hasClass('on')) {
        lyricPlayer.pause(lyricPlayer.PLAY);
      } else {
        lyricPlayer.pause(lyricPlayer.PAUSE);
      }
    });
    //alert({$musictype|default=0});
    musicView.musicViewElem.find("ul").attr('class',init_music_type);

    
  }
}

// 提供 app 音乐暂停接口
function appPauseMusic() {
  musicView.audioPlayer.isPlay = true;
  musicView.audioPlayer._play();
  lyricPlayer.pause(lyricPlayer.PAUSE);
}
// 提供 app 音乐播放接口
function appPlayMusic() {
  musicView.audioPlayer.isPlay = false;
  musicView.audioPlayer._play();
  lyricPlayer.pause(lyricPlayer.PLAY);
}

function androidMusicInit() {
  musicView.audioPlayer.isPlay = false;
  musicView.audioPlayer._play();
}

function escapeHtml(text) {
  if (text.length == 0){ return "" };

  var map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
    " ": '&nbsp;'
  };

  return text.replace(/[&<>"' ]/g, function(m) { return map[m]; });
}

function decodeEscapeHtml(text) {
  if (text.length == 0){ return "" };

  var map = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#039;': "'",
    '&nbsp;': ' '
  };

  return text.replace(/(&nbsp;|&amp;|&lt;|&gt;|&quot;|&#039;)/g, function(m) { return map[m]; });
}

/* textPlayer **********************************/
var textPlayer = {
  // 文本节点创建器
  textNodeCreater:function(elem,endCallBack,endCallBackThis) {
    this._node = $(elem.elem);
    this._animate = elem.animate;

    // 设置动画回调
    if(endCallBack) {
      this._node.bind('oanimationend animationend webkitAnimationEnd',
        function() {
          endCallBack.call(endCallBackThis);
        }
      );
    }

    // 动画设置
    /* var _this = this;
    this._node.bind('oanimationstart animationstart webkitAnimationStart',
        function() {
          if(_this.animateCss) {
            _this.css(_this.animateCss);
          }
        }
    ); */

    // 设置文接口
    this.setTextValue = function(val){
      this._node.find('.textValue').html(val);
    };

    // 设置动画接口
    this.setAnimate = function(cfg) {
      // 播放时间
      var time = cfg.duration + 's';
      // 延迟时间
      var delayTime = '0s';
      if(cfg.delay) {
        delayTime = cfg.delay + 's';
      }
      // 播放函数
      var timeFunc = cfg.timeFunc;
      if(!timeFunc) {
        timeFunc = 'ease';
      }

      var animate = [cfg.name,time,timeFunc,delayTime].join(' ');
      this.css({
        '-webkit-animation':animate,
        'animation':animate,
      });
    }

    // 设置 css 接口.
    this.css = function(val) {
      this._node.css(val);
    }
  },
  /***********/

  // 显示元素
  _displayDiv : undefined,
  _textNodes : [], // 文本节点

  // 配置文件
  _textCfgs: undefined,
  _animateCfgs : undefined,

  // 文本索引
  _textIdx : 0,
  _textNodeIdx : 0,
  _playCount: 0,
  _playRoundEnd: 0,
  _roundSleepTime: 5000,
  _intervalSleepTime: 2000,

  start : function(textArr, textConfig) {
    if (textArr.length <= 0) {
      console.log('no text!');
      return;
    };

    this._textCfgs = textConfig;

    var random = Math.random();
    // 生成乱序效果
    for(var i=0,len=Math.floor(this._textCfgs.length/2);i<len;++i) {
      var oPos = Math.floor(random * (i+1) * 173) % this._textCfgs.length;
      var nPos = Math.floor(random * (i+1) * 34) % this._textCfgs.length;
      var tmp = this._textCfgs[oPos];
      this._textCfgs[oPos] = this._textCfgs[nPos];
      this._textCfgs[nPos] = tmp;
    }

    this._textArr = [];

    for(var i=0,len=textArr.length;i<len;++i){
      var text = textArr[i];
      if(text.length > 0) {
        this._textArr.push(escapeHtml(textArr[i]));
      }
    }

    this._displayDiv = $('#TextView');
    this.playNext();
  },

  playNext : function() {
    this._displayDiv[0].innerHTML = "";

    var textNode = undefined;
    var nodeIdx = this._textNodes.length;
    var random = Math.random();

    for(var i=0,len=1;i<len;++i) {
      // 获取配置
      if(nodeIdx + i < this._textCfgs.length || this._textNodes.length <= 0) {
        var cfgIdx = nodeIdx + i;
        // 若需显示个数大于文字效果个数随机生成几个.
        if(cfgIdx > this._textCfgs.length - 1) {
          cfgIdx = Math.floor(random * this._textCfgs.length);
        }
        textNode = new this.textNodeCreater(this._textCfgs[cfgIdx](),this.playEnd,this);
        this._textNodes.push(textNode);
      } else {
        textNode = this._textNodes[this._textNodeIdx];
        this._textNodeIdx = (this._textNodeIdx + 1) % this._textNodes.length;
      }
      var animateCfg = textNode._animate;

      textNode.animateCss = animateCfg.endCss;

      // 设置文本信息
      textNode.setTextValue(this._textArr[this._textIdx]);
      textNode.setAnimate(animateCfg.animate);

      // 设置样式
      /* if(animateCfg.beginCss) {
        textNode.css(animateCfg.beginCss);
      } else */ if(animateCfg.endCss) {
        textNode.css(animateCfg.endCss);
      }
      
      this._textIdx = (this._textIdx + 1) % this._textArr.length;

      if(this._textIdx == 0) {
        this._playRoundEnd = 1;
      }

      this._displayDiv.append(textNode._node);
    }
  },

  playEnd : function () {
    if(--this._playCount <= 0) {
      if(this._playRoundEnd == 1) {
        this._playRoundEnd = 0;
        this._displayDiv[0].innerHTML = "";

        // 回合直接的间隔
        setTimeout(function(){
          textPlayer.playNext();
        },this._roundSleepTime);
      } else {
        this._displayDiv[0].innerHTML = "";

        setTimeout(function(){
          textPlayer.playNext();
        },this._intervalSleepTime);
        
      }
    }
  }
}