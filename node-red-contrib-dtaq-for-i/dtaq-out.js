const { dbconn, dbstmt } = require('idb-connector');

module.exports = function (RED) {
    function DtaqOutNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;


        const connection = new dbconn();
        connection.conn('*LOCAL');
        const sql = " CALL QSYS2.SEND_DATA_QUEUE(MESSAGE_DATA => ?,DATA_QUEUE => ?\
            ,DATA_QUEUE_LIBRARY => ?,KEY_DATA => ?)";


        node.on('input', function (msg) {
            const statement = new dbstmt(connection);
            statement.prepare(sql, (error) => {
                if (error) {
                    node.error(error);
                    node.error(JSON.stringify(error));
                    throw error;
                }

                const params = [JSON.stringify(msg.payload), config.queue, config.library, msg.key_data];
                statement.bindParameters(params, (error) => {
                    if (error) {
                        node.error(error);
                        node.error(JSON.stringify(error));
                        throw error;
                    }
                    statement.execute((out, error) => {
                        if (error) {
                            node.error(error);
                            node.error(JSON.stringify(error));
                            throw error;
                        }

                        node.status({ fill: "green", shape: "ring", text: "done" });
                    });
                });
            });
        });
    }

    RED.nodes.registerType("dtaq-out", DtaqOutNode);
}
