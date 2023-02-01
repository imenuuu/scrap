exports.getOnlyLogDir = function name(dirPath) {
    let dirSplit = dirPath.split('/');
    for(var i = 0; i < dirSplit.length; i++) {
        let dirNm = dirSplit[i];
        if(dirNm == 'taskJob') return dirSplit.slice(i+1, dirSplit.length-1);
    }
}