import { LightningElement, api, wire, track } from "lwc";
import { refreshApex } from "@salesforce/apex";
import getComments from "@salesforce/apex/ThreadController.getComments";
import archiveThread from "@salesforce/apex/ThreadController.archiveThread";

export default class ThreadDetail extends LightningElement {
    @api thread;
    @api caseId;
    wiredCommentsResult;
    selectedCommentId;
    sortDirection = 'desc';
    @track showModal = false;

    get threadId() {
        return this.thread?.Id;
    }

    get sortedComments() {
        if (!this.wiredCommentsResult.data) return [];
        return [...this.wiredCommentsResult.data].sort((a, b) => {
            const dateA = new Date(a.CreatedDate);
            const dateB = new Date(b.CreatedDate);
            return this.sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
        });
    }

    get sortIcon() {
        return this.sortDirection === 'asc' ? 'utility:arrowup' : 'utility:arrowdown';
    }

    get isDescending() {
        return this.sortDirection === 'desc';
    }

    get isArchived() {
        return this.thread?.IsArchived__c;
    }

    handleSortChange() {
        this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    }

    @wire(getComments, { threadId: "$threadId" })
    wiredComments(result) {
        this.wiredCommentsResult = result;
    }

    handleReply(event) {
        this.selectedCommentId = event.detail;
    }

    handleCommentAdded() {
        refreshApex(this.wiredCommentsResult);
        this.dispatchEvent(new CustomEvent('commentadded', { bubbles: true, composed: true }));
        this.selectedCommentId = null;
    }

    handleArchiveClick() {
        this.showModal = true;
    }

    closeModal() {
        this.showModal = false;
    }

    handleArchive() {
        archiveThread({ threadId: this.threadId })
            .then(() => {
                refreshApex(this.wiredCommentsResult);
                this.dispatchEvent(new CustomEvent('threadarchived', { detail: this.threadId }));
                this.closeModal();
            })
            .catch(error => {
                console.error("Error archiving thread:", error);
                this.closeModal();
            });
    }
}