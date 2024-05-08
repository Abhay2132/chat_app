const { isTable } = require("./utilz");

function setupDEVroutes(router){
    router.post("/api/db", async (req, res, next)=>{
        const {action, data} = req.body;
        if (action == "execute"){
            let result;
            try {
                result = await execute(data);
            } catch (error) {
                result = error.toString()
            }
            return res.json(result);
        } 
        else if(action == "istable"){
            let {db,table} = data;
            let result = await isTable(db, table);
            return res.json({result})
        }
    
        next();
    })
}

module.exports = {
    setupDEVroutes
}