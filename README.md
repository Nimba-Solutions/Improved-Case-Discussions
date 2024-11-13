# Improved-Case-Discussions

This project aims to provide a lightweight improvement over Salesforce's standard Case Comments.

## Feature List

- **Full Rich Text Support**
  - Includes file upload and preview.



- **Internal-Only Comment Support**
![{F70A16D6-964D-4947-A536-39F41057B9CD}](https://github.com/user-attachments/assets/353ea2e7-899a-4b60-abb6-d372165ccaaa)
  - Allows for internal team comments not visible to external users.


- **In-Line Case Team Management**
![{EABF21E5-6EB4-417E-9BF3-69D9EE6E7C3E}](https://github.com/user-attachments/assets/fba69b27-6bb3-47e8-8f3c-9ef5a8f876ea)
  - **Role-Based Controls for Collaborators**
    - Streamlined interface for searching and adding Case Team Members & Roles
    - If no Case Roles are defined in the org, a default role "Collaborator" is created.


- **In-Line CaseCollaborator__c Management**
    - Streamlined interface for searching and adding multiple contacts to a Case
![{35BEBFE8-F172-4D1B-9C6A-BC5166C716C0}](https://github.com/user-attachments/assets/1d8f4889-3c52-405e-8e36-21b25e3914ce)


- **Archive Discussions**
  - Options for archiving include:
    - When a Case is closed.
    - When a button is clicked.
    - On a schedule.
    - When a designated platform event is fired (to support custom logic).
![{FA340A68-CD14-4ACE-B620-D76699A6DC4D}](https://github.com/user-attachments/assets/896f3033-cd24-483b-a28a-5fa269b0c424)

- **User Notifications**
  - **In-App Notifications**
    - Notify users within the app.
  - **Email Notifications**
    - Notify users via email when new comments are added.

- **User Mentions**
  - Using `@mention` triggers the creation of a `CommentMention` record for reporting purposes.
![{1A8F24C4-E660-4633-9CE1-30576DB0EBB9}](https://github.com/user-attachments/assets/26926e01-5c65-4afb-917a-2e8b13abbbec)

- **Platform Support**
  - Compatible across Salesforce, Communities, and Lightning-Out (with current limitations).

- **Email-Based Collaborators**
  - **Email Notifications**
    - Receive notifications for new comments.
  - **Email Responses**
    - Respond directly to notifications to add comments via email.


## Development

To work on this project in a scratch org:

1. [Set up CumulusCI](https://cumulusci.readthedocs.io/en/latest/tutorial.html)
2. Run `cci flow run dev_org --org dev` to deploy this project.
3. Run `cci org browser dev` to open the org in your browser.
