import { LightningElement, api } from "lwc";

export default class CommentItem extends LightningElement {
    @api comment;

    get formattedDate() {
        const commentDate = new Date(this.comment.CreatedDate);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        // Reset time portions for date comparison
        const commentDateOnly = new Date(commentDate.getFullYear(), commentDate.getMonth(), commentDate.getDate());
        const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const yesterdayOnly = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());

        if (commentDateOnly.getTime() === todayOnly.getTime()) {
            return "Today";
        } else if (commentDateOnly.getTime() === yesterdayOnly.getTime()) {
            return "Yesterday";
        } else {
            return new Intl.DateTimeFormat('en-US', { 
                month: '2-digit', 
                day: '2-digit', 
                year: 'numeric'
            }).format(commentDate);
        }
    }

    renderedCallback() {
        const container = this.template.querySelector('.slds-text-body_regular');
        if (container && this.comment.Body__c) {
            container.innerHTML = this.comment.Body__c;
        }
    }

    handleReply() {
        this.dispatchEvent(
            new CustomEvent("reply", {
                detail: this.comment.Id,
            })
        );
    }
}