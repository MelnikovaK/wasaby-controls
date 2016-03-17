define('js!SBIS3.TestTreeDataGrid',
    [
        'js!SBIS3.CORE.CompoundControl',
        'js!SBIS3.CONTROLS.PathSelector',
        'html!SBIS3.TestTreeDataGrid',
        'js!SBIS3.CONTROLS.SbisServiceSource',
        'css!SBIS3.TestTreeDataGrid',
        'js!SBIS3.CONTROLS.TreeDataGrid',
        'js!SBIS3.CONTROLS.Switcher'
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

                var tree1 = this.getChildControlByName('TreeDataGrid 1');
                var tree2 = this.getChildControlByName('TreeDataGrid 2');

                var dataSource = new SbisServiceSource({
                   endpoint: 'TreeDataGrid'
                });
                tree1.setDataSource(dataSource);

                initState = this.getChildControlByName('Switcher 1').getState();
                if (initState === "off") {
                    tree1.setVisible(false);
                    tree2.setVisible(true);
                } else {
                    tree1.setVisible(true);
                    tree2.setVisible(false);
                }

                this.getChildControlByName('Switcher 1').subscribe('onActivated', function (event, state) {
                    if (state == 'on') {
                        tree1.setVisible(true);
                        tree2.setVisible(false);
                    } else {
                        tree1.setVisible(false);
                        tree2.setVisible(true);
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
            outFileName: "integration_treedatagrid",
            htmlTemplate: "/intest/pageTemplates/onlineTemplate.html"
        };

        return moduleClass;
    });
