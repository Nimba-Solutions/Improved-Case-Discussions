import { LightningElement, api, wire } from 'lwc';
import { refreshApex } from '@salesforce/apex';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import searchUsers from '@salesforce/apex/CaseTeamService.searchUsers';
import addTeamMember from '@salesforce/apex/CaseTeamService.addTeamMember';
import getTeamMembers from '@salesforce/apex/CaseTeamService.getTeamMembers';
import removeTeamMember from '@salesforce/apex/CaseTeamService.removeTeamMember';
import getCaseTeamRoles from '@salesforce/apex/CaseTeamService.getCaseTeamRoles';

export default class CaseTeam extends LightningElement {
    @api recordId;
    searchTerm = '';
    showUserList = false;
    userResults = [];
    wiredTeamMembersResult;
    wiredRolesResult;

    @wire(getTeamMembers, { caseId: '$recordId' })
    wiredTeamMembers(result) {
        this.wiredTeamMembersResult = result;
    }

    @wire(getCaseTeamRoles)
    wiredRoles(result) {
        this.wiredRolesResult = result;
    }

    get teamMembers() {
        return this.wiredTeamMembersResult?.data || [];
    }

    get roles() {
        return this.wiredRolesResult?.data || [];
    }

    get teamMemberPills() {
        return this.teamMembers.map(member => ({
            type: 'avatar',
            label: `${member.Member.Name} (${member.TeamRole.Name})`,
            name: member.Id,
            src: member.Member.SmallPhotoUrl,
            fallbackIconName: 'standard:user',
            variant: 'circle',
            alternativeText: 'User avatar'
        }));
    }

    handleSearchChange(event) {
        this.searchTerm = event.target.value;
        if (this.searchTerm.length >= 2) {
            this.searchUsers();
            this.showUserList = true;
        } else {
            this.showUserList = false;
            this.userResults = [];
        }
    }

    async searchUsers() {
        try {
            this.userResults = await searchUsers({ searchTerm: this.searchTerm });
        } catch (error) {
            console.error('Error searching users:', error);
            this.userResults = [];
        }
    }

        async handleRoleSelect(event) {
        const userId = event.currentTarget.dataset.userid;
        const roleId = event.currentTarget.dataset.roleid;
        
        try {
            await addTeamMember({ 
                caseId: this.recordId, 
                userId: userId,
                roleId: roleId
            });
            
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Success',
                    message: 'Team member added',
                    variant: 'success'
                })
            );
            
            await refreshApex(this.wiredTeamMembersResult);
            this.showUserList = false;
            this.searchTerm = '';
            this.userResults = [];
            
        } catch (error) {
            console.error('Error adding team member:', error);
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error',
                    message: error.body?.message || 'Error adding team member',
                    variant: 'error'
                })
            );
        }
    }
    
    async handleRemoveTeamMember(event) {
        const memberId = event.detail.item.name;
        
        try {
            await removeTeamMember({ memberId });
            await refreshApex(this.wiredTeamMembersResult);
            
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Success',
                    message: 'Team member removed',
                    variant: 'success'
                })
            );
        } catch (error) {
            console.error('Error removing team member:', error);
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error',
                    message: error.body?.message || 'Error removing team member',
                    variant: 'error'
                })
            );
        }
    }
}