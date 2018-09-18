let mode = process.env.NODE_ENV;
let settings = {};

if(mode == 'PRODUCTION'){
    settings.api = ""
}
else if(mode == 'MOCK'){
    settings.api = ""
}