import { LightningElement, api, wire } from 'lwc';
import { refreshApex } from '@salesforce/apex';
import getThreads from "@salesforce/apex/ThreadController.getThreads";

export default class CaseDiscussions extends LightningElement {
    @api recordId;
    threads = [];
    activeSectionName = '';
    wiredThreadsResult;

    get hasThreads() {
        return this.threads.length > 0;
    }

    get newThread() {
        if (!this.hasThreads) return true;
        return !this.threads.some(thread => !thread.IsArchived__c);
    }

    get activeThreads() {
        return this.threads.filter(thread => !thread.IsArchived__c);
    }

    @wire(getThreads, { caseId: "$recordId" })
    wiredThreads(result) {
        this.wiredThreadsResult = result;
        if (result.data) {
            this.threads = result.data.map(thread => ({
                ...thread,
                displayTitle: thread.IsArchived__c ? `${thread.Title__c} (Archived)` : thread.Title__c
            }));

            if (this.activeThreads.length > 0) {
                const mostRecentThread = this.activeThreads.reduce((latest, current) => {
                    const latestDate = latest.LastCommentDate__c || latest.CreatedDate;
                    const currentDate = current.LastCommentDate__c || current.CreatedDate;
                    return new Date(currentDate) > new Date(latestDate) ? current : latest;
                });
                this.activeSectionName = mostRecentThread.Id;
                requestAnimationFrame(() => {
                    const accordion = this.template.querySelector('lightning-accordion');
                    if (accordion) {
                        accordion.activeSectionName = this.activeSectionName;
                    }
                });
            } else {
                this.activeSectionName = 'new-thread';
            }
        }
    }

    handleCommentAdded() {
        refreshApex(this.wiredThreadsResult);
    }

    handleThreadArchived() {
        refreshApex(this.wiredThreadsResult);
        this.activeSectionName = 'new-thread';
        requestAnimationFrame(() => {
            const accordion = this.template.querySelector('lightning-accordion');
            if (accordion) {
                accordion.activeSectionName = this.activeSectionName;
            }
        });
    }
}