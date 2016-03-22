define('js!SBIS3.TestTreeCompositeViewList',
    [
        'js!SBIS3.CORE.CompoundControl',
        'js!SBIS3.CONTROLS.PathSelector',
        'html!SBIS3.TestTreeCompositeViewList',
        'js!SBIS3.CONTROLS.SbisServiceSource',
        'css!SBIS3.TestTreeCompositeViewList',
        'js!SBIS3.CONTROLS.TreeCompositeView',
        "js!SBIS3.CONTROLS.Switcher"
    ], function (CompoundControl, PathSelector, dotTplFn, SbisServiceSource) {

        var moduleClass = CompoundControl.extend({

            _dotTplFn: dotTplFn,

            $protected: {
                _options: {}
            },

            $constructor: function () {
            },

            init: function () {
                moduleClass.superclass.init.call(this);

                var multiView1 = this.getChildControlByName('TreeCompositeView 1');
                var multiView2 = this.getChildControlByName('TreeCompositeView 2');
                var multiViewSource = new SbisServiceSource({endpoint: 'TreeCompositeViewList'});
                multiView1.setDataSource(multiViewSource);


                initState = this.getChildControlByName('Switcher 1').getState();
                if (initState === "off") {
                    multiView1.setVisible(false);
                    multiView2.setVisible(true);
                } else {
                    multiView1.setVisible(true);
                    multiView2.setVisible(false);
                }

                this.getChildControlByName('Switcher 1').subscribe('onActivated', function (event, state) {
                    if (state == 'on') {
                        multiView1.setVisible(true);
                        multiView2.setVisible(false);
                    } else {
                        multiView1.setVisible(false);
                        multiView2.setVisible(true);
                    }
                });
            },

            editRecord: function (item) {
                console.log("edit");
            },

            moveRecord: function (item) {
                console.log("move");
            },

            deleteRecord: function (item) {
                this.deleteRecords(item.data('id'));
            }

        });

        moduleClass.webPage = {
            outFileName: "integration_treecompositeview_list",
            htmlTemplate: "/intest/pageTemplates/onlineTemplate.html"
        };

        return moduleClass;
    });
