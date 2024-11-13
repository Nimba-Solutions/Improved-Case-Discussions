import { LightningElement, api, wire } from 'lwc';
import { refreshApex } from '@salesforce/apex';
import searchContacts from '@salesforce/apex/CaseCollaboratorController.searchContacts';
import addCollaborator from '@salesforce/apex/CaseCollaboratorController.addCollaborator';
import getCollaborators from '@salesforce/apex/CaseCollaboratorController.getCollaborators';
import removeCollaborator from '@salesforce/apex/CaseCollaboratorController.removeCollaborator';
import getCaseContact from '@salesforce/apex/CaseCollaboratorController.getCaseContact';

export default class CaseCollaborator extends LightningElement {
    @api recordId;
    searchTerm = '';
    showContactList = false;
    contactResults = [];
    wiredCollaboratorsResult;
    wiredCaseContactResult;

    @wire(getCollaborators, { caseId: '$recordId' })
    wiredCollaborators(result) {
        this.wiredCollaboratorsResult = result;
    }

    @wire(getCaseContact, { caseId: '$recordId' })
    wiredCaseContact(result) {
        this.wiredCaseContactResult = result;
    }

    get collaborators() {
        return this.wiredCollaboratorsResult?.data || [];
    }

    get caseContact() {
        return this.wiredCaseContactResult?.data;
    }

    get collaboratorPills() {
        const pills = [];
        
        if (this.caseContact) {
            pills.push({
                type: 'avatar',
                label: this.caseContact.Name,
                name: 'case-contact',
                fallbackIconName: 'utility:favorite',
                variant: 'circle',
                alternativeText: this.caseContact.Name,
                iconName: 'utility:favorite',
                iconAlternativeText: 'Primary Contact',
                hasError: false,
                isError: false,
                'data-item-id': 'case-contact'  // Adding custom attribute
            });
        }

        // Add other collaborator pills
        const collaboratorPills = this.collaborators.map(collab => ({
            type: 'avatar',
            label: collab.Contact__r.Name,
            name: collab.Id,
            fallbackIconName: 'standard:contact',
            variant: 'circle',
            alternativeText: collab.Contact__r.Name
        }));

        return [...pills, ...collaboratorPills];
    }

    handleSearchChange(event) {
        this.searchTerm = event.target.value;
        if (this.searchTerm.length >= 2) {
            this.searchContacts();
            this.showContactList = true;
        } else {
            this.showContactList = false;
            this.contactResults = [];
        }
    }

    async searchContacts() {
        try {
            this.contactResults = await searchContacts({ searchTerm: this.searchTerm });
        } catch (error) {
            console.error('Error searching contacts:', error);
            this.contactResults = [];
        }
    }

    async handleContactSelect(event) {
        const contactId = event.currentTarget.dataset.contactid;
        
        try {
            await addCollaborator({ 
                caseId: this.recordId, 
                contactId: contactId 
            });
            await refreshApex(this.wiredCollaboratorsResult);
            this.showContactList = false;
            this.searchTerm = '';
            this.contactResults = [];
        } catch (error) {
            console.error('Error adding collaborator:', error);
        }
    }
    
    async handleRemoveCollaborator(event) {
        const collaboratorId = event.detail.item.name;
        
        try {
            await removeCollaborator({ collaboratorId: collaboratorId });
            await refreshApex(this.wiredCollaboratorsResult);
        } catch (error) {
            console.error('Error removing collaborator:', error);
        }
    }
}