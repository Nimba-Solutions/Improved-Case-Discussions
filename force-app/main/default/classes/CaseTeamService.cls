public with sharing class CaseTeamService {
    private static final String CASE_COLLABORATOR_ROLE = 'Collaborator';
    
    @AuraEnabled
    public static List<User> searchUsers(String searchTerm) {
        String searchKey = '%' + searchTerm + '%';
        return [
            SELECT Id, Name, SmallPhotoUrl 
            FROM User 
            WHERE IsActive = true 
            AND (Name LIKE :searchKey OR Email LIKE :searchKey)
            LIMIT 5
        ];
    }
    
    @AuraEnabled(cacheable=true)
    public static List<CaseTeamMember> getTeamMembers(Id caseId) {
        return [
            SELECT 
                Id, 
                MemberId,
                TeamRole.Name,
                TYPEOF Member
                    WHEN User THEN Name, SmallPhotoUrl
                    WHEN Contact THEN Name
                END
            FROM CaseTeamMember 
            WHERE ParentId = :caseId
            WITH SECURITY_ENFORCED
        ];
    }
    
    @AuraEnabled
    public static void removeTeamMember(Id memberId) {
        CaseTeamMember member = [SELECT Id FROM CaseTeamMember WHERE Id = :memberId WITH SECURITY_ENFORCED];
        delete member;
    }
    
    @AuraEnabled
    public static void addTeamMember(Id caseId, Id userId, Id roleId) {
        List<CaseTeamRole> roles = [SELECT Id FROM CaseTeamRole WHERE Id = :roleId LIMIT 1];
        
        if (roles.isEmpty()) {
            createRoleAndAddMember(caseId, userId);
        } else {
            addMemberWithRole(caseId, userId, roleId);
        }
    }
    
    @future
    private static void createRoleAndAddMember(Id caseId, Id userId) {
        CaseTeamRole role = new CaseTeamRole(
            Name = CASE_COLLABORATOR_ROLE,
            AccessLevel = 'Edit'
        );
        insert role;
        
        System.enqueueJob(new QueueableTeamMember(caseId, userId, role.Id));
    }
    
    @AuraEnabled(cacheable=true)
    public static List<CaseTeamRole> getCaseTeamRoles() {
        List<CaseTeamRole> roles = [SELECT Id, Name FROM CaseTeamRole WITH SECURITY_ENFORCED];
        if(roles.isEmpty()) {
            roles = new List<CaseTeamRole>{
                new CaseTeamRole(
                    Id = null,
                    Name = 'Collaborator'
                )
            };
        }
        return roles;
    }
    
    private static void addMemberWithRole(Id caseId, Id userId, Id roleId) {
        CaseTeamMember member = new CaseTeamMember(
            ParentId = caseId,
            MemberId = userId,
            TeamRoleId = roleId
        );
        
        insert member;
    }
    
    private class QueueableTeamMember implements Queueable {
        private Id caseId;
        private Id userId;
        private Id roleId;
        
        public QueueableTeamMember(Id caseId, Id userId, Id roleId) {
            this.caseId = caseId;
            this.userId = userId;
            this.roleId = roleId;
        }
        
        public void execute(QueueableContext context) {
            addMemberWithRole(caseId, userId, roleId);
        }
    }
}