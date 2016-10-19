/* jsTunnel **********************************/
var jsTunnel = {
    callExtend: function(){
        switch(arguments[0]) {
            case 'getPics':
                return mvCfg.pics;
            case 'initFinish':
                $('.loadingWrap').remove();
                initFunc();
                musicView.init();
                if(typeof android != "undefined") {
                    if(typeof android.musicInit != "undefined") {
                        android.musicInit();
                    } else {
                        alert('no defined android.musicInit');
                    }
                }
                if(typeof musicPrepared != "undefined") {
                    musicPrepared({"load":"ok"});
                }
                textPlayer.start(mvCfg.texts,textCfg);
                return;
            case 'changeLoaderPro':
                var text = $('#loadingPro');
                text.html(Math.floor(arguments[1]*100/arguments[2])+"%");
                return;
            case 'changeLoaderText':
                var text = $('#loadingText');
                text.html(arguments[1]);
                return;
        }
    },
    egretCallBack : undefined
}