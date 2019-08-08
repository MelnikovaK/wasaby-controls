define([
   'Controls/form',
   'Types/entity',
   'Types/function',
   'Core/Deferred',
   'Types/source',
   'require'
], function(form, entity, func, Deferred, source, require) {
   'use strict';
   
   //TODO: Удалить эти тесты из юнитов, написать задачу на интеграционное тестирование по этим сценариям

   describe('FormController2-tests', function() {
      var testControl, testElement;
      
      function mountControl(moduleName) {
         var def = new Deferred();
         require(['Core/Control', moduleName], function(CoreControl, Component) {
            var element = document.body.querySelectorAll('#formControllerComponent')[0];
            var config = {
               element: element,
               dataSource: new source.Memory({
                  idProperty: 'id',
                  data: [{ id: 0 }]
               })
            };
            testControl = CoreControl.createControl(Component, config, element);
            var baseAfterMount = testControl._afterMount;

            testControl._afterMount = function() {
               baseAfterMount.apply(this, arguments);
               func.delay(function() {
                  waiting(function() {
                     def.callback(testControl);
                  });
               });
            };
         });
         return def;
      }

      function check(cfg) {
         var key1 = document.body.querySelectorAll('.form-content__key')[0].innerText;
         var key2 = cfg.key;
         key1 = typeof key1 === 'string' ? key1.trim() : key1;
         key2 = typeof key2 === 'string' ? key2.trim() : key2;
         assert.equal(key1, key2);

         assert.equal(document.body.querySelectorAll('.form-content__name .controls-InputBase__nativeField')[0].value, cfg.name);
         assert.equal(document.body.querySelectorAll('.form-content__email .controls-InputBase__nativeField')[0].value, cfg.email);
         assert.equal(document.body.querySelectorAll('.form-content__create .controls-BaseButton__text')[0].innerText, cfg.createButtonText);
         assert.equal(document.body.querySelectorAll('.form-content__select>*').length, cfg.selectButtonsCount);
      }

      function waiting(cb) {
         var self = this, args = arguments;
         setTimeout(function() {
            setTimeout(function() {
               setTimeout(function() {
                  setTimeout(function() {
                     setTimeout(function() {
                        setTimeout(function() {
                           setTimeout(function() {
                              setTimeout(function() {
                                 setTimeout(function() {
                                    setTimeout(function() {
                                       cb.apply(self, args);
                                    }, 0);
                                 }, 0);
                              }, 0);
                           }, 0);
                        }, 0);
                     }, 0);
                  }, 0);
               }, 0);
            }, 0);
         }, 0);
      }

      function doSteps(control, arr) {
         function step(stepCfg) {
            var action = stepCfg.action;
            var updateId = stepCfg.updateId;
            var answer = stepCfg.answer;
            var checkCfg = stepCfg.checkCfg;
            var checkFn = stepCfg.checkFn;
            var def = new Deferred();

            var stepCallback = function stepCallback() {
               waiting(function() {
                  checkCfg && check(checkCfg);
                  checkFn && checkFn(testControl);
                  def.callback();
               });
            };
            var stepErrback = function stepErrback(e) {
               def.errback(e);
            };

            switch (action) {
               case 'create':
                  var initValues = {
                     nameText: 'no name',
                     emailText: 'no@email.com'
                  };
                  control.__$resultForTests = answer;
                  waiting(function() {
                     control._create({
                        initValues: initValues,
                        ResultForTests: answer
                     }).addCallbacks(stepCallback, stepErrback);
                  });
                  break;
               case 'read':
                  control.__$resultForTests = answer;
                  waiting(function() {
                     control._read({ key: updateId, ResultForTests: answer }).addCallbacks(stepCallback, stepErrback);
                  });
                  break;
               case 'update':
                  waiting(function() {
                     control._update().addCallbacks(stepCallback, stepErrback);
                  });
                  break;
               case 'delete':
                  waiting(function() {
                     control._delete().addCallbacks(stepCallback, stepErrback);
                  });
                  break;
            }
            if (typeof action === 'function') {
               action(control);
               def = new Deferred();
               waiting(function() {
                  def.callback();
               });
            }
            return def;
         }


         function recur(i, resultDef) {
            if (i === arr.length) {
               resultDef.callback();
               return;
            }
            var def = step(arr[i]);
            def.addCallback(function() {
               recur(i + 1, resultDef);
            });
            def.addErrback(function(e) {
               resultDef.errback(e);
            });
         }

         var def = new Deferred();
         recur(0, def);
         return def;
      }

      beforeEach(function() {
         return this.skip(); // https://online.sbis.ru/opendoc.html?guid=3cdac997-40da-4f0e-a2a5-80002df264cb
         if (!document || !document.body) {// Проверка того, что тесты выполняются в браузере
            this.skip();
         } else {
            var el = document.body.querySelectorAll('#mocha')[0];
            testElement = document.createElement('div');
            testElement.setAttribute('id', 'formControllerComponent');
            el.appendChild(testElement);
         }
      });

      it('FormController - SimpleCase', function(done) {
         waiting.call(this, function() {
            var mountedDef = mountControl('Controls-demo/FormController/FormController');
            mountedDef.addCallback(function(control) {
               check({ // при инициализации
                  key: 'now is ' + 0,
                  name: '',
                  email: '',
                  createButtonText: 'create with id = ' + 1,
                  selectButtonsCount: 1
               });

               var resultDef = doSteps(control, [{
                  action: 'create',
                  answer: true,
                  checkCfg: {
                     key: 'now is ' + 1, // нажали создать новый
                     name: 'no name',
                     email: 'no@email.com',
                     createButtonText: 'create with id = ' + 2,
                     selectButtonsCount: 1
                  }
               }, {
                  action: 'update',
                  answer: true,
                  checkCfg: {
                     key: 'now is ' + 1,
                     name: 'no name',
                     email: 'no@email.com',
                     createButtonText: 'create with id = ' + 2,
                     selectButtonsCount: 2 // сохранили новый
                  }
               }, {
                  action: 'create',
                  answer: true,
                  checkCfg: {
                     key: 'now is ' + 2, // еше раз нажали создать новый
                     name: 'no name',
                     email: 'no@email.com',
                     createButtonText: 'create with id = ' + 3,
                     selectButtonsCount: 2
                  }
               }, {
                  action: 'create',
                  answer: true, // на вопрос сохранить отвечаем да
                  checkCfg: {
                     key: 'now is ' + 3,
                     name: 'no name',
                     email: 'no@email.com',
                     createButtonText: 'create with id = ' + 4,
                     selectButtonsCount: 2 // при еще одном сохранили 2й
                  }
               }, {
                  action: 'create',
                  answer: false, // на вопрос сохранить отвечаем нет
                  checkCfg: {
                     key: 'now is ' + 4,
                     name: 'no name',
                     email: 'no@email.com',
                     createButtonText: 'create with id = ' + 5,
                     selectButtonsCount: 2 // а теперь при создании ответили не сохранять и 3й не сохранился
                  }
               }, {
                  action: 'read', // читаем 0й
                  updateId: 0,
                  answer: true, // при этом отвечаем сохранить 4й
                  checkCfg: {
                     key: 'now is ' + 0,
                     name: '',
                     email: '',
                     createButtonText: 'create with id = ' + 5,
                     selectButtonsCount: 2 // итого у нас 0, 1, 2, 4 сохранены.
                  }
               }, {
                  action: 'read',
                  updateId: 1,
                  answer: true,
                  checkCfg: {
                     key: 'now is ' + 1,
                     name: 'no name',
                     email: 'no@email.com',
                     createButtonText: 'create with id = ' + 5,
                     selectButtonsCount: 2
                  }
               }, {
                  action: 'read',
                  updateId: 2,
                  answer: true,
                  checkCfg: {
                     key: 'now is',
                     name: '',
                     email: '',
                     createButtonText: 'create with id = ' + 5,
                     selectButtonsCount: 2
                  }
               }, {
                  action: 'read',
                  updateId: 3,
                  answer: true,
                  checkCfg: {
                     key: 'now is',
                     name: '',
                     email: '',
                     createButtonText: 'create with id = ' + 5,
                     selectButtonsCount: 2
                  }
               }, {
                  action: 'read',
                  updateId: 4,
                  answer: true,
                  checkCfg: {
                     key: 'now is',
                     name: '',
                     email: '',
                     createButtonText: 'create with id = ' + 5,
                     selectButtonsCount: 2
                  }
               }, {
                  action: 'read',
                  updateId: 0,
                  answer: true,
                  checkCfg: {
                     key: 'now is ' + 0,
                     name: '',
                     email: '',
                     createButtonText: 'create with id = ' + 5,
                     selectButtonsCount: 2
                  }
               }, {
                  action: 'delete',
                  answer: true,
                  checkCfg: {
                     key: 'now is',
                     name: '',
                     email: '',
                     createButtonText: 'create with id = ' + 5,
                     selectButtonsCount: 1
                  }
               }
               ]);
               resultDef.addCallbacks(function() {
                  done();
               }, function(e) {
                  done(e);
               });
            });
            mountedDef.addErrback(function(e) {
               done(e);
            });
         });
      }).timeout(6000);

      it('FormController - requestCustomUpdate is true', function(done) {
         waiting.call(this, function() {
            var mountedDef = mountControl('Controls-demo/FormController/FormController');
            mountedDef.addCallback(function(control) {
               var resultDef = doSteps(control, [
                  {
                     action: 'create',
                     answer: true
                  }, {
                     action: function(control) {
                        control._requestCustomUpdate = function() {
                           return true;
                        };
                     }
                  }, {
                     action: 'update',
                     answer: true,
                     checkCfg: {
                        key: 'now is ' + 1,
                        name: 'no name',
                        email: 'no@email.com',
                        createButtonText: 'create with id = ' + 2,
                        selectButtonsCount: 1
                     }
                  }, {
                     action: function(control) {
                        control._requestCustomUpdate = function() {
                           return false;
                        };
                     }
                  }, {
                     action: 'update',
                     answer: true,
                     checkCfg: {
                        key: 'now is ' + 1,
                        name: 'no name',
                        email: 'no@email.com',
                        createButtonText: 'create with id = ' + 2,
                        selectButtonsCount: 2
                     }
                  }, {
                     action: 'create',
                     answer: true
                  }, {
                     action: function(control) {
                        control._requestCustomUpdate = function() {
                           return new Promise(function(resolve) {
                              resolve(true);
                           });
                        };
                     }
                  }, {
                     action: 'update',
                     answer: true,
                     checkCfg: {
                        key: 'now is ' + 2,
                        name: 'no name',
                        email: 'no@email.com',
                        createButtonText: 'create with id = ' + 3,
                        selectButtonsCount: 2
                     }
                  }, {
                     action: function(control) {
                        control._requestCustomUpdate = function() {
                           return new Promise(function(resolve) {
                              resolve(false);
                           });
                        };
                     }
                  }, {
                     action: 'update',
                     answer: true,
                     checkCfg: {
                        key: 'now is ' + 2,
                        name: 'no name',
                        email: 'no@email.com',
                        createButtonText: 'create with id = ' + 3,
                        selectButtonsCount: 3
                     }
                  },
               ]);
               resultDef.addCallbacks(function() {
                  done();
               }, function(e) {
                  done(e);
               });
            });
            mountedDef.addErrback(function(e) {
               done(e);
            });
         });
      }).timeout(6000);

      it('FormController - check record inside', function(done) {
         waiting.call(this, function() {
            var mountedDef = mountControl('Controls-demo/FormController/FormController');
            mountedDef.addCallback(function(control) {
               var resultDef = doSteps(control, [
                  {
                     action: 'create',
                     answer: true
                  }, {
                     action: function(control) {
                        control._requestCustomUpdate = function() {
                           return true;
                        };
                     }
                  }, {
                     action: function(control) {
                        var record = new entity.Record();
                        record.set({ testValue: 'testValue' });
                        control._updateValuesByRecord(record);
                     }
                  }, {
                     action: function(control) {
                        assert.equal(control._children.Container._options.record.get('testValue'), 'testValue');
                     }
                  }
               ]);
               resultDef.addCallbacks(function() {
                  done();
               }, function(e) {
                  done(e);
               });
            });
            mountedDef.addErrback(function(e) {
               done(e);
            });
         });
      }).timeout(6000);

      it('FormController - multiple update', function(done) {
         waiting.call(this, function() {
            var mountedDef = mountControl('Controls-demo/FormController/FormController');
            mountedDef.addCallback(function(control) {
               var resultDef = doSteps(control, [
                  {
                     action: 'create',
                     answer: true
                  }, {
                     action: 'update',
                     answer: true
                  }, {
                     action: function(control) {
                        control._record.set('value1', true);
                     }
                  }, {
                     action: function(control) {
                        control._children.formControllerInst.update().addErrback(function(e) {
                           done(e);
                        });
                     }
                  }, {
                     action: function(control) {
                        control._record.set('value2', true);
                     }
                  }, {
                     action: function(control) {
                        control._children.formControllerInst.update().addErrback(function(e) {
                           done(e);
                        });
                     }
                  }, {
                     action: function(control) {
                        control._record.set('value3', true);
                     }
                  }, {
                     action: function(control) {
                        control._children.registrator.finishPendingOperations().addErrback(function() {
                           done(e);
                        });
                     }
                  }
               ]);
               resultDef.addCallbacks(function() {
                  done();
               }, function(e) {
                  done(e);
               });
            });
            mountedDef.addErrback(function(e) {
               done(e);
            });
         });
      }).timeout(6000);

      it('FormController - record unchanged', function(done) {
         waiting.call(this, function() {
            var mountedDef = mountControl('Controls-demo/FormController/FormController');
            mountedDef.addCallback(function(control) {
               var resultDef = doSteps(control, [
                  {
                     action: 'create',
                     answer: true
                  }, {
                     action: function(control) {
                        control._record.set('value1', false);
                     }
                  }, {
                     action: 'update',
                     answer: true
                  }, {
                     action: function(control) {
                        control._record.set('value1', true);
                     }
                  }, {
                     action: function(control) {
                        control._record.set('value1', false);
                     }
                  }, {
                     action: function(control) {
                        assert.equal(control._children.registrator._hasRegisteredPendings(), false);
                     }
                  }
               ]);
               resultDef.addCallbacks(function() {
                  done();
               }, function(e) {
                  done(e);
               });
            });
            mountedDef.addErrback(function(e) {
               done(e);
            });
         });
      }).timeout(6000);

      afterEach(function() {
         testControl && testControl.destroy();
         testElement && testElement.remove();
      });
   });
});
