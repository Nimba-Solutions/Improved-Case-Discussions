import { LightningElement, api } from "lwc";
import archiveThread from "@salesforce/apex/ThreadController.archiveThread";

export default class ThreadItem extends LightningElement {
    @api thread;

    handleArchive() {
        archiveThread({ threadId: this.thread.Id })
            .then(() => {
                this.dispatchEvent(new CustomEvent('threadarchived', { detail: this.thread.Id }));
            })
            .catch(error => {
                console.error("Error archiving thread:", error);
            });
    }
}