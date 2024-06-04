/******/ (function() { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 3454:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

"use strict";

var _global_process, _global_process1;
module.exports = ((_global_process = __webpack_require__.g.process) == null ? void 0 : _global_process.env) && typeof ((_global_process1 = __webpack_require__.g.process) == null ? void 0 : _global_process1.env) === "object" ? __webpack_require__.g.process : __webpack_require__(7663);

//# sourceMappingURL=process.js.map

/***/ }),

/***/ 9180:
/***/ (function(__unused_webpack_module, __unused_webpack___webpack_exports__, __webpack_require__) {

"use strict";

// EXTERNAL MODULE: ./node_modules/o1js/dist/web/index.js
var web = __webpack_require__(9466);
;// CONCATENATED MODULE: ./src/utils/zkUtils.ts

function serializeTransaction(tx) {
    const length = tx.transaction.accountUpdates.length;
    let i;
    let blindingValues = [];
    for(i = 0; i < length; i++){
        const la = tx.transaction.accountUpdates[i].lazyAuthorization;
        if (la !== undefined && la.blindingValue !== undefined && la.kind === "lazy-proof") blindingValues.push(la.blindingValue.toJSON());
        else blindingValues.push("");
    }
    const serializedTransaction = JSON.stringify({
        tx: tx.toJSON(),
        blindingValues,
        length,
        fee: tx.transaction.feePayer.body.fee.toJSON(),
        sender: tx.transaction.feePayer.body.publicKey.toBase58(),
        nonce: tx.transaction.feePayer.body.nonce.toBigint().toString()
    }, null, 2);
    return serializedTransaction;
}
function transactionParams(serializedTransaction) {
    const { fee, sender, nonce } = JSON.parse(serializedTransaction);
    return {
        fee: web/* UInt64 */.zM.fromJSON(fee),
        sender: web/* PublicKey */.nh.fromBase58(sender),
        nonce: Number(nonce)
    };
}
function deserializeTransaction(serializedTransaction, txNew, isReplaceFeePayer, signedData) {
    const { tx, blindingValues, length } = JSON.parse(serializedTransaction);
    let parsedTx = JSON.parse(tx);
    if (isReplaceFeePayer) {
        const parsedZkCommond = JSON.parse(signedData);
        parsedTx.feePayer = parsedZkCommond.zkappCommand.feePayer;
    }
    const transaction = web/* Mina */.No.Transaction.fromJSON(parsedTx);
    if (length !== txNew.transaction.accountUpdates.length) {
        throw new Error("New Transaction length mismatch");
    }
    if (length !== transaction.transaction.accountUpdates.length) {
        throw new Error("Serialized Transaction length mismatch");
    }
    for(let i = 0; i < length; i++){
        transaction.transaction.accountUpdates[i].lazyAuthorization = txNew.transaction.accountUpdates[i].lazyAuthorization;
        if (blindingValues[i] !== "") transaction.transaction.accountUpdates[i].lazyAuthorization.blindingValue = web/* Field */.gN.fromJSON(blindingValues[i]);
    }
    return transaction;
}
function transactionParamsV2(serializedTransaction) {
    const parsedZkCommond = JSON.parse(serializedTransaction);
    const { publicKey, nonce, fee } = parsedZkCommond.zkappCommand.feePayer.body;
    return {
        fee: web/* UInt64 */.zM.fromJSON(fee),
        sender: web/* PublicKey */.nh.fromBase58(publicKey),
        nonce: Number(nonce)
    };
}

;// CONCATENATED MODULE: ./src/utils/zkappWorker.ts


const state = {
    Add: null,
    zkapp: null,
    transaction: null,
    verificationKey: null,
    serializeTx: ""
};
// ---- -----------------------------------------------------------------------------------
const functions = {
    setActiveInstanceToBerkeley: async (args)=>{
        const Berkeley = web/* Mina */.No.Network(args.gqlUrl + "/graphql");
        console.log("Zk Instance Created");
        web/* Mina */.No.setActiveInstance(Berkeley);
    },
    loadContract: async (args)=>{
        const { Add } = await __webpack_require__.e(/* import() */ 733).then(__webpack_require__.bind(__webpack_require__, 3733));
        state.Add = Add;
    },
    compileContract: async (args)=>{
        const { verificationKey } = await state.Add.compile();
        state.verificationKey = verificationKey;
    },
    fetchAccount: async (args)=>{
        const publicKey = web/* PublicKey */.nh.fromBase58(args.publicKey58);
        return await (0,web/* fetchAccount */.$G)({
            publicKey
        });
    },
    initZkappInstance: async (args)=>{
        const publicKey = web/* PublicKey */.nh.fromBase58(args.publicKey58);
        state.zkapp = new state.Add(publicKey);
    },
    getNum: async (args)=>{
        const currentNum = await state.zkapp.num.get();
        return JSON.stringify(currentNum.toJSON());
    },
    createUpdateTransaction: async (args)=>{
        const transaction = await web/* Mina */.No.transaction(async ()=>{
            await state.zkapp.update();
        });
        state.transaction = transaction;
    },
    createManulUpdateTransaction: async (args)=>{
        const nextValue = (0,web/* Field */.gN)(args.value);
        const transaction = await web/* Mina */.No.transaction(async ()=>{
            await state.zkapp.setValue(nextValue);
        });
        state.transaction = transaction;
        const data = JSON.stringify({
            tx: serializeTransaction(transaction),
            value: nextValue.toJSON(),
            address: args.zkAddress
        }, null, 2);
        state.serializeTx = data;
    },
    proveUpdateTransaction: async (args)=>{
        await state.transaction.prove();
    },
    getTransactionJSON: async (args)=>{
        return state.transaction.toJSON();
    },
    createDeployTransaction: async (args)=>{
        if (state === null) {
            throw Error("state is null");
        }
        const zkAppPrivateKey = web/* PrivateKey */._q.fromBase58(args.privateKey58);
        const feePayerPublickKey = web/* PublicKey */.nh.fromBase58(args.feePayer);
        const transaction = await web/* Mina */.No.transaction(feePayerPublickKey, async ()=>{
            web/* AccountUpdate */.nx.fundNewAccount(feePayerPublickKey);
            await state.zkapp.deploy({
                verificationKey: state.verificationKey
            });
        });
        transaction.sign([
            zkAppPrivateKey
        ]);
        state.transaction = transaction;
    },
    signAndSendTx: async (args)=>{
        const Berkeley = web/* Mina */.No.Network(args.gqlUrl + "/graphql");
        web/* Mina */.No.setActiveInstance(Berkeley);
        const { Add } = await __webpack_require__.e(/* import() */ 733).then(__webpack_require__.bind(__webpack_require__, 3733));
        const zkPublicKey = web/* PublicKey */.nh.fromBase58(args.publicKey);
        const zkApp = new Add(zkPublicKey);
        await Add.compile();
        const deployer = web/* PrivateKey */._q.fromBase58(args.sendPrivateKey);
        const sender = deployer.toPublicKey();
        const value = (0,web/* Field */.gN)(10);
        const fee = 1e8;
        await (0,web/* fetchAccount */.$G)({
            publicKey: sender
        });
        await (0,web/* fetchAccount */.$G)({
            publicKey: zkPublicKey
        });
        const tx = await web/* Mina */.No.transaction({
            sender,
            fee
        }, async ()=>{
            await zkApp.setValue(value);
        });
        tx.sign([
            deployer
        ]);
        await tx.prove();
        const sendRes = await tx.send();
        return sendRes.hash;
    },
    buildTxBody: async (args)=>{
        const Berkeley = web/* Mina */.No.Network(args.gqlUrl + "/graphql");
        web/* Mina */.No.setActiveInstance(Berkeley);
        const { Add } = await __webpack_require__.e(/* import() */ 733).then(__webpack_require__.bind(__webpack_require__, 3733));
        const zkPublicKey = web/* PublicKey */.nh.fromBase58(args.zkPublicKey);
        const zkApp = new Add(zkPublicKey);
        const deployer = web/* PrivateKey */._q.fromBase58(args.sendPrivateKey);
        const sender = deployer.toPublicKey();
        const value = (0,web/* Field */.gN)(1);
        const fee = 1e8;
        await (0,web/* fetchAccount */.$G)({
            publicKey: sender
        });
        await (0,web/* fetchAccount */.$G)({
            publicKey: zkPublicKey
        });
        const tx = await web/* Mina */.No.transaction({
            sender,
            fee
        }, async ()=>{
            await zkApp.setValue(value);
        });
        tx.sign([
            deployer
        ]);
        const data = JSON.stringify({
            tx: serializeTransaction(tx),
            value: value.toJSON(),
            address: args.zkPublicKey
        }, null, 2);
        return data;
    },
    onlyProving: async (args)=>{
        const { tx: serializedTransaction, value, address } = JSON.parse(args.signedData);
        const zkAppPublicKey = web/* PublicKey */.nh.fromBase58(address);
        const { fee, sender, nonce } = transactionParams(serializedTransaction);
        const Berkeley = web/* Mina */.No.Network(args.gqlUrl + "/graphql");
        web/* Mina */.No.setActiveInstance(Berkeley);
        const { Add } = await __webpack_require__.e(/* import() */ 733).then(__webpack_require__.bind(__webpack_require__, 3733));
        const zkApp = new Add(zkAppPublicKey);
        await (0,web/* fetchAccount */.$G)({
            publicKey: sender
        });
        await (0,web/* fetchAccount */.$G)({
            publicKey: zkAppPublicKey
        });
        const txNew = await web/* Mina */.No.transaction({
            sender,
            fee,
            nonce
        }, async ()=>{
            await zkApp.setValue(web/* Field */.gN.fromJSON(value));
        });
        const tx = deserializeTransaction(serializedTransaction, txNew);
        await Add.compile();
        await tx.prove();
        const txSent = await tx.send();
        return txSent.hash;
    },
    sendProving: async (args)=>{
        const { tx: serializedTransaction, value, address } = JSON.parse(state.serializeTx);
        const zkAppPublicKey = web/* PublicKey */.nh.fromBase58(address);
        const { fee, sender, nonce } = transactionParamsV2(args.signedData);
        await (0,web/* fetchAccount */.$G)({
            publicKey: sender
        });
        await (0,web/* fetchAccount */.$G)({
            publicKey: zkAppPublicKey
        });
        const { Add } = await __webpack_require__.e(/* import() */ 733).then(__webpack_require__.bind(__webpack_require__, 3733));
        const zkApp = new Add(zkAppPublicKey);
        const txNew = await web/* Mina */.No.transaction({
            sender,
            fee,
            nonce
        }, async ()=>{
            await zkApp.setValue(web/* Field */.gN.fromJSON(value));
        });
        const tx = deserializeTransaction(serializedTransaction, txNew, true, args.signedData);
        await Add.compile();
        await tx.prove();
        const txSent = await tx.send();
        return txSent.hash;
    }
};
if (true) {
    addEventListener("message", async (event)=>{
        const returnData = await functions[event.data.fn](event.data.args);
        const message = {
            id: event.data.id,
            data: returnData
        };
        postMessage(message);
    });
}
console.log("Web Worker Successfully Initialized.");


/***/ }),

/***/ 7663:
/***/ (function(module) {

var __dirname = "/";
(function(){var e={229:function(e){var t=e.exports={};var r;var n;function defaultSetTimout(){throw new Error("setTimeout has not been defined")}function defaultClearTimeout(){throw new Error("clearTimeout has not been defined")}(function(){try{if(typeof setTimeout==="function"){r=setTimeout}else{r=defaultSetTimout}}catch(e){r=defaultSetTimout}try{if(typeof clearTimeout==="function"){n=clearTimeout}else{n=defaultClearTimeout}}catch(e){n=defaultClearTimeout}})();function runTimeout(e){if(r===setTimeout){return setTimeout(e,0)}if((r===defaultSetTimout||!r)&&setTimeout){r=setTimeout;return setTimeout(e,0)}try{return r(e,0)}catch(t){try{return r.call(null,e,0)}catch(t){return r.call(this,e,0)}}}function runClearTimeout(e){if(n===clearTimeout){return clearTimeout(e)}if((n===defaultClearTimeout||!n)&&clearTimeout){n=clearTimeout;return clearTimeout(e)}try{return n(e)}catch(t){try{return n.call(null,e)}catch(t){return n.call(this,e)}}}var i=[];var o=false;var u;var a=-1;function cleanUpNextTick(){if(!o||!u){return}o=false;if(u.length){i=u.concat(i)}else{a=-1}if(i.length){drainQueue()}}function drainQueue(){if(o){return}var e=runTimeout(cleanUpNextTick);o=true;var t=i.length;while(t){u=i;i=[];while(++a<t){if(u){u[a].run()}}a=-1;t=i.length}u=null;o=false;runClearTimeout(e)}t.nextTick=function(e){var t=new Array(arguments.length-1);if(arguments.length>1){for(var r=1;r<arguments.length;r++){t[r-1]=arguments[r]}}i.push(new Item(e,t));if(i.length===1&&!o){runTimeout(drainQueue)}};function Item(e,t){this.fun=e;this.array=t}Item.prototype.run=function(){this.fun.apply(null,this.array)};t.title="browser";t.browser=true;t.env={};t.argv=[];t.version="";t.versions={};function noop(){}t.on=noop;t.addListener=noop;t.once=noop;t.off=noop;t.removeListener=noop;t.removeAllListeners=noop;t.emit=noop;t.prependListener=noop;t.prependOnceListener=noop;t.listeners=function(e){return[]};t.binding=function(e){throw new Error("process.binding is not supported")};t.cwd=function(){return"/"};t.chdir=function(e){throw new Error("process.chdir is not supported")};t.umask=function(){return 0}}};var t={};function __nccwpck_require__(r){var n=t[r];if(n!==undefined){return n.exports}var i=t[r]={exports:{}};var o=true;try{e[r](i,i.exports,__nccwpck_require__);o=false}finally{if(o)delete t[r]}return i.exports}if(typeof __nccwpck_require__!=="undefined")__nccwpck_require__.ab=__dirname+"/";var r=__nccwpck_require__(229);module.exports=r})();

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		var threw = true;
/******/ 		try {
/******/ 			__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 			threw = false;
/******/ 		} finally {
/******/ 			if(threw) delete __webpack_module_cache__[moduleId];
/******/ 		}
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = __webpack_modules__;
/******/ 	
/******/ 	// the startup function
/******/ 	__webpack_require__.x = function() {
/******/ 		// Load entry module and return exports
/******/ 		// This entry module depends on other loaded chunks and execution need to be delayed
/******/ 		var __webpack_exports__ = __webpack_require__.O(undefined, [674], function() { return __webpack_require__(9180); })
/******/ 		__webpack_exports__ = __webpack_require__.O(__webpack_exports__);
/******/ 		return __webpack_exports__;
/******/ 	};
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/chunk loaded */
/******/ 	!function() {
/******/ 		var deferred = [];
/******/ 		__webpack_require__.O = function(result, chunkIds, fn, priority) {
/******/ 			if(chunkIds) {
/******/ 				priority = priority || 0;
/******/ 				for(var i = deferred.length; i > 0 && deferred[i - 1][2] > priority; i--) deferred[i] = deferred[i - 1];
/******/ 				deferred[i] = [chunkIds, fn, priority];
/******/ 				return;
/******/ 			}
/******/ 			var notFulfilled = Infinity;
/******/ 			for (var i = 0; i < deferred.length; i++) {
/******/ 				var chunkIds = deferred[i][0];
/******/ 				var fn = deferred[i][1];
/******/ 				var priority = deferred[i][2];
/******/ 				var fulfilled = true;
/******/ 				for (var j = 0; j < chunkIds.length; j++) {
/******/ 					if ((priority & 1 === 0 || notFulfilled >= priority) && Object.keys(__webpack_require__.O).every(function(key) { return __webpack_require__.O[key](chunkIds[j]); })) {
/******/ 						chunkIds.splice(j--, 1);
/******/ 					} else {
/******/ 						fulfilled = false;
/******/ 						if(priority < notFulfilled) notFulfilled = priority;
/******/ 					}
/******/ 				}
/******/ 				if(fulfilled) {
/******/ 					deferred.splice(i--, 1)
/******/ 					var r = fn();
/******/ 					if (r !== undefined) result = r;
/******/ 				}
/******/ 			}
/******/ 			return result;
/******/ 		};
/******/ 	}();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	!function() {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = function(exports, definition) {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	}();
/******/ 	
/******/ 	/* webpack/runtime/ensure chunk */
/******/ 	!function() {
/******/ 		__webpack_require__.f = {};
/******/ 		// This file contains only the entry chunk.
/******/ 		// The chunk loading function for additional chunks
/******/ 		__webpack_require__.e = function(chunkId) {
/******/ 			return Promise.all(Object.keys(__webpack_require__.f).reduce(function(promises, key) {
/******/ 				__webpack_require__.f[key](chunkId, promises);
/******/ 				return promises;
/******/ 			}, []));
/******/ 		};
/******/ 	}();
/******/ 	
/******/ 	/* webpack/runtime/get javascript chunk filename */
/******/ 	!function() {
/******/ 		// This function allow to reference async chunks and sibling chunks for the entrypoint
/******/ 		__webpack_require__.u = function(chunkId) {
/******/ 			// return url for filenames not based on template
/******/ 			if (chunkId === 674) return "static/chunks/982f5ae2-d693cd4a5ab462cf.js";
/******/ 			// return url for filenames based on template
/******/ 			return "static/chunks/" + chunkId + "." + "abd2d5b6999da149" + ".js";
/******/ 		};
/******/ 	}();
/******/ 	
/******/ 	/* webpack/runtime/get mini-css chunk filename */
/******/ 	!function() {
/******/ 		// This function allow to reference async chunks and sibling chunks for the entrypoint
/******/ 		__webpack_require__.miniCssF = function(chunkId) {
/******/ 			// return url for filenames based on template
/******/ 			return undefined;
/******/ 		};
/******/ 	}();
/******/ 	
/******/ 	/* webpack/runtime/global */
/******/ 	!function() {
/******/ 		__webpack_require__.g = (function() {
/******/ 			if (typeof globalThis === 'object') return globalThis;
/******/ 			try {
/******/ 				return this || new Function('return this')();
/******/ 			} catch (e) {
/******/ 				if (typeof window === 'object') return window;
/******/ 			}
/******/ 		})();
/******/ 	}();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	!function() {
/******/ 		__webpack_require__.o = function(obj, prop) { return Object.prototype.hasOwnProperty.call(obj, prop); }
/******/ 	}();
/******/ 	
/******/ 	/* webpack/runtime/trusted types policy */
/******/ 	!function() {
/******/ 		var policy;
/******/ 		__webpack_require__.tt = function() {
/******/ 			// Create Trusted Type policy if Trusted Types are available and the policy doesn't exist yet.
/******/ 			if (policy === undefined) {
/******/ 				policy = {
/******/ 					createScriptURL: function(url) { return url; }
/******/ 				};
/******/ 				if (typeof trustedTypes !== "undefined" && trustedTypes.createPolicy) {
/******/ 					policy = trustedTypes.createPolicy("nextjs#bundler", policy);
/******/ 				}
/******/ 			}
/******/ 			return policy;
/******/ 		};
/******/ 	}();
/******/ 	
/******/ 	/* webpack/runtime/trusted types script url */
/******/ 	!function() {
/******/ 		__webpack_require__.tu = function(url) { return __webpack_require__.tt().createScriptURL(url); };
/******/ 	}();
/******/ 	
/******/ 	/* webpack/runtime/publicPath */
/******/ 	!function() {
/******/ 		__webpack_require__.p = "/_next/";
/******/ 	}();
/******/ 	
/******/ 	/* webpack/runtime/importScripts chunk loading */
/******/ 	!function() {
/******/ 		// no baseURI
/******/ 		
/******/ 		// object to store loaded chunks
/******/ 		// "1" means "already loaded"
/******/ 		var installedChunks = {
/******/ 			506: 1
/******/ 		};
/******/ 		
/******/ 		// importScripts chunk loading
/******/ 		var installChunk = function(data) {
/******/ 			var chunkIds = data[0];
/******/ 			var moreModules = data[1];
/******/ 			var runtime = data[2];
/******/ 			for(var moduleId in moreModules) {
/******/ 				if(__webpack_require__.o(moreModules, moduleId)) {
/******/ 					__webpack_require__.m[moduleId] = moreModules[moduleId];
/******/ 				}
/******/ 			}
/******/ 			if(runtime) runtime(__webpack_require__);
/******/ 			while(chunkIds.length)
/******/ 				installedChunks[chunkIds.pop()] = 1;
/******/ 			parentChunkLoadingFunction(data);
/******/ 		};
/******/ 		__webpack_require__.f.i = function(chunkId, promises) {
/******/ 			// "1" is the signal for "already loaded"
/******/ 			if(!installedChunks[chunkId]) {
/******/ 				if(true) { // all chunks have JS
/******/ 					importScripts(__webpack_require__.tu(__webpack_require__.p + __webpack_require__.u(chunkId)));
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 		
/******/ 		var chunkLoadingGlobal = self["webpackChunk_N_E"] = self["webpackChunk_N_E"] || [];
/******/ 		var parentChunkLoadingFunction = chunkLoadingGlobal.push.bind(chunkLoadingGlobal);
/******/ 		chunkLoadingGlobal.push = installChunk;
/******/ 		
/******/ 		// no HMR
/******/ 		
/******/ 		// no HMR manifest
/******/ 	}();
/******/ 	
/******/ 	/* webpack/runtime/startup chunk dependencies */
/******/ 	!function() {
/******/ 		var next = __webpack_require__.x;
/******/ 		__webpack_require__.x = function() {
/******/ 			return __webpack_require__.e(674).then(next);
/******/ 		};
/******/ 	}();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// run startup
/******/ 	var __webpack_exports__ = __webpack_require__.x();
/******/ 	_N_E = __webpack_exports__;
/******/ 	
/******/ })()
;