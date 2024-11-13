public with sharing class CaseCollaboratorController {
    @AuraEnabled
    public static List<Contact> searchContacts(String searchTerm) {
        String searchKey = '%' + searchTerm + '%';
        return [
            SELECT Id, Name, Email 
            FROM Contact 
            WHERE Name LIKE :searchKey 
            OR Email LIKE :searchKey
            LIMIT 5
        ];
    }
    
    @AuraEnabled(cacheable=true)
    public static Contact getCaseContact(Id caseId) {
        Case currentCase = [SELECT ContactId FROM Case WHERE Id = :caseId WITH SECURITY_ENFORCED];
        if (currentCase.ContactId != null) {
            return [
                SELECT Id, Name, Email 
                FROM Contact 
                WHERE Id = :currentCase.ContactId 
                WITH SECURITY_ENFORCED
                LIMIT 1
            ];
        }
        return null;
    }
    
    @AuraEnabled(cacheable=true)
    public static List<CaseCollaborator__c> getCollaborators(Id caseId) {
        return [
            SELECT 
                Id,
                Contact__c,
                Contact__r.Name,
                Contact__r.Email
            FROM CaseCollaborator__c 
            WHERE Case__c = :caseId
            WITH SECURITY_ENFORCED
        ];
    }
    
    @AuraEnabled
    public static void removeCollaborator(Id collaboratorId) {
        CaseCollaborator__c collaborator = [
            SELECT Id 
            FROM CaseCollaborator__c 
            WHERE Id = :collaboratorId 
            WITH SECURITY_ENFORCED
        ];
        delete collaborator;
    }
    
    @AuraEnabled
    public static void addCollaborator(Id caseId, Id contactId) {
        CaseCollaborator__c collaborator = new CaseCollaborator__c(
            Case__c = caseId,
            Contact__c = contactId
        );
        insert collaborator;
    }
}