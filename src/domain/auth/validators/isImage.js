const path = require('path');

function isImage(filename) {
    if (!filename) return false;
    switch (path.extname(filename)) {
        case '.png': return true;
        case '.gif': return true;
        case '.jpg': return true;
        case '.jpeg': return true;
        default: return false;
    }
}

module.exports = isImage;