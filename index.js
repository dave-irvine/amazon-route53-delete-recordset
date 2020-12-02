const core = require('@actions/core');
const aws = require('aws-sdk');

async function run() {
    try {
        const route53 = new aws.Route53({
            customUserAgent: 'amazon-route53-delete-recordset-for-github-actions'
        });

        // Get inputs
        const name = core.getInput('name', { required: true });
        const type = core.getInput('type', { required: true });
        const recordsInput = core.getInput('records', { required: true });
        const hostedZoneId = core.getInput('hosted-zone-id', { required: true });
        const waitForChange = core.getInput('wait-for-change', { required: false }) || 'true';

        const recordsArray = recordsInput.split(",") || [];
        const records = recordsArray.map((record) => {
            return {
                Value: record
            };
        });

        try {
            const params = {
                ChangeBatch: {
                    Changes: [
                        {
                            Action: "DELETE",
                            ResourceRecordSet: {
                                Name: name,
                                ResourceRecords: records,
                                Type: type
                            }
                        }
                    ],
                },
                HostedZoneId: hostedZoneId
            };

            const result = await route53.changeResourceRecordSets(params).promise();

            if (waitForChange && waitForChange.toLowerCase() === 'true') {
                await route53.waitFor('resourceRecordSetsChanged', {
                    Id: result.ChangeInfo.Id
                });
            }
        } catch (error) {
            core.setFailed("Failed to update Route53: " + error.message);
            throw (error);
        }
    }
    catch (error) {
        core.setFailed(error.message);
        core.debug(error.stack);
    }
}

module.exports = run;

/* istanbul ignore next */
if (require.main === module) {
    run();
}