import { LightningElement, api, wire } from "lwc";
import addComment from "@salesforce/apex/ThreadController.addComment";
import getSmallPhotoUrl from "@salesforce/apex/CommentService.getSmallPhotoUrl";
import searchUsers from "@salesforce/apex/CommentService.searchUsers";
import USER_ID from "@salesforce/user/Id";
import { getRecord } from "lightning/uiRecordApi";
import NAME_FIELD from "@salesforce/schema/User.Name";

export default class CommentEditor extends LightningElement {
  @api threadId;
  @api caseId;
  @api parentCommentId;
  commentBody = "";
  isInternal = false;
  userName;
  userPhotoUrl;
  showUserList = false;
  searchTerm = "";
  userResults = [];
  currentSearchPosition = -1;
  mentionedUsers = [];

  @wire(getSmallPhotoUrl, { userId: USER_ID })
  wirePhoto({ data }) {
    if (data) {
      this.userPhotoUrl = data;
    }
  }

  @wire(getRecord, {
    recordId: USER_ID,
    fields: [NAME_FIELD],
  })
  wireUser({ data }) {
    if (data) {
      this.userName = data.fields.Name.value;
    }
  }

  handleRichTextChange(event) {
    this.commentBody = event.target.value;
    const editor = this.template.querySelector("lightning-input-rich-text");
    const text = editor.value;
    const plainText = text.replace(/<[^>]*>/g, "");

    const atIndex = plainText.lastIndexOf("@");
    if (atIndex !== -1) {
      const textAfterAt = plainText.substring(atIndex + 1);
      const spaceIndex = textAfterAt.indexOf(" ");

      if (spaceIndex === -1) {
        this.currentSearchPosition = text.lastIndexOf("@");
        this.showUserList = true;
        this.searchTerm = textAfterAt;
        this.searchUsers();
      } else if (atIndex !== this.currentSearchPosition) {
        this.showUserList = false;
      }
    }
  }

  async searchUsers() {
    try {
      this.userResults = await searchUsers({ searchTerm: this.searchTerm });
    } catch (error) {
      console.error("Error searching users:", error);
      this.userResults = [];
    }
  }

  handleUserSelect(event) {
    const userId = event.currentTarget.dataset.userid;
    const userName = event.currentTarget.dataset.username;
    const editor = this.template.querySelector("lightning-input-rich-text");
    const text = editor.value;

    const beforeAt = text.substring(0, this.currentSearchPosition);
    const afterSearch = text.substring(
      this.currentSearchPosition + this.searchTerm.length + 1
    );

    const mentionHtml = `<a href="/lightning/r/User/${userId}/view" style="color: rgb(0, 112, 210);">@${userName}</a>&nbsp;`;
    editor.value = beforeAt + mentionHtml + afterSearch;
    this.commentBody = editor.value;
    this.mentionedUsers.push(userId);
    this.showUserList = false;
    this.searchTerm = "";
  }

  handleInternalChange(event) {
    this.isInternal = event.target.checked;
  }

  async handleSubmit(event) {
    event.preventDefault();
    if (!this.commentBody) return;

    try {
      await addComment({
        body: this.commentBody,
        caseId: this.caseId,
        threadId: this.threadId,
        parentCommentId: this.parentCommentId,
        isInternal: this.isInternal,
        mentionedUserIds: this.mentionedUsers || [],
      });

      this.commentBody = "";
      this.isInternal = false;
      this.mentionedUsers = [];
      this.dispatchEvent(new CustomEvent("commentadded", { bubbles: true, composed: true }));
    } catch (error) {
      console.error("Error creating comment:", error);
    }
  }
}