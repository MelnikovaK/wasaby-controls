/**
 * Created by kraynovdo on 19.09.2017.
 */
import PopupManager = require("./PopupManager");
class StackManager {
    public showStackArea() {
        let myPopupManager = new PopupManager();
        myPopupManager.showPopup()
    }
}
export = StackManager