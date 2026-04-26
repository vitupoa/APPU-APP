import re
import os

path1 = 'c:/Users/ADMIN/Krieta/composeApp/src/commonMain/kotlin/com/krieta/feature/sponsored/presentation/screen/BrandDashboardScreen.kt'
with open(path1, 'r', encoding='utf-8') as f:
    c1 = f.read()
c1 = c1.replace('campaign.status,', 'campaign.status.name,')
c1 = c1.replace('when (campaign.status) {', 'when (campaign.status.name) {')
c1 = c1.replace('campaign.status == "ACTIVE"', 'campaign.status.name == "ACTIVE"')
c1 = c1.replace('campaign.status == "PAUSED"', 'campaign.status.name == "PAUSED"')
with open(path1, 'w', encoding='utf-8') as f:
    f.write(c1)

path2 = 'c:/Users/ADMIN/Krieta/composeApp/src/commonMain/kotlin/com/krieta/feature/sponsored/presentation/screen/CampaignAnalyticsScreen.kt'
with open(path2, 'r', encoding='utf-8') as f:
    c2 = f.read()
c2 = c2.replace('Text(text = content.status)', 'Text(text = content.status.name)')
c2 = c2.replace('Text(content.status,', 'Text(content.status.name,')
with open(path2, 'w', encoding='utf-8') as f:
    f.write(c2)

path3 = 'c:/Users/ADMIN/Krieta/composeApp/src/commonMain/kotlin/com/krieta/feature/sponsored/presentation/screen/CreateCampaignScreen.kt'
with open(path3, 'r', encoding='utf-8') as f:
    c3 = f.read()
c3 = c3.replace('type = type,', 'type = com.krieta.feature.sponsored.domain.model.SponsoredContentType.valueOf(type),')
c3 = c3.replace('pricingModel = pricingModel,', 'pricingModel = com.krieta.feature.sponsored.domain.model.PricingModel.valueOf(pricingModel),')
with open(path3, 'w', encoding='utf-8') as f:
    f.write(c3)

print("Fixed")
