import { LightningElement, api, wire } from "lwc";
import { refreshApex } from "@salesforce/apex";
import getThreads from "@salesforce/apex/ThreadController.getThreads";
import createThread from "@salesforce/apex/ThreadController.createThread";

export default class ThreadList extends LightningElement {
    @api caseId;
    wiredThreadsResult;

    @wire(getThreads, { caseId: "$caseId" })
    wiredThreads(result) {
        this.wiredThreadsResult = result;
        if (result.data) {
            this.handleThreadAvailability(result.data);
            const activeThreads = result.data.filter(thread => !thread.IsArchived__c);
            if (activeThreads.length > 0) {
                const mostRecentThread = activeThreads.reduce((latest, current) => {
                    const latestDate = latest.LastCommentDate__c || latest.CreatedDate;
                    const currentDate = current.LastCommentDate__c || current.CreatedDate;
                    return new Date(currentDate) > new Date(latestDate) ? current : latest;
                });
                this.dispatchEvent(new CustomEvent("threadselect", { detail: mostRecentThread.Id }));
            }
            this.dispatchEvent(new CustomEvent("threadsloaded", { detail: result.data }));
        }
    }

    async handleThreadAvailability(threads) {
        const activeThreads = threads.filter((thread) => !thread.IsArchived__c);
        if (activeThreads.length === 0) {
            try {
                await createThread({
                    title: `Case Discussion ${new Date().toLocaleDateString()}`,
                    caseId: this.caseId,
                });
                refreshApex(this.wiredThreadsResult);
            } catch (error) {
                console.error("Error creating thread:", error);
            }
        }
    }

    handleThreadSelect(event) {
        const threadId = event.currentTarget.dataset.id;
        this.dispatchEvent(new CustomEvent("threadselect", { detail: threadId }));
    }
}