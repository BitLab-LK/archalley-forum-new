import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Competition Terms & Conditions | Archalley Competition 2025',
  description: 'Terms and Conditions for Archalley Competition 2025 - Innovative Christmas Tree',
};

export default function CompetitionTermsPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="bg-black border-b border-orange-500">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <Link
            href="/events/archalley-competition-2025"
            className="text-white/80 mb-6 flex items-center gap-2 hover:text-orange-500 transition-colors text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Competition
          </Link>
          
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Competition Terms & Conditions
          </h1>
          <p className="text-orange-500 text-sm font-medium">
            Archalley Competition 2025 - Innovative Christmas Tree
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Introduction */}
        <div className="mb-12 text-white text-lg space-y-4">
          <p>
            We invite everyone, irrespective of their age, gender, profession, or qualifications, to join the competition and present the product.
          </p>
          <p>
            All entries should respond directly to the competition—to design a Christmas tree based on the theme, &apos;Christmas in Future.&apos;
          </p>
        </div>
        
        {/* Terms in Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Physical Tree Category */}
          <div className="bg-slate-800/70 rounded-lg p-6">
            <h3 className="text-xl font-bold text-white mb-4">Physical Tree Category</h3>
            <div className="text-white space-y-3 text-sm">
              <p><strong>Build it for real:</strong> The tree must be a physically made product (in 2D or 3D form) and photographed for submission.</p>
              <p><strong>Real photos only:</strong> Upload actual photographs of the built tree. Post-processing is limited to basic global color/exposure correction and cropping.</p>
              <p><strong>Strictly no AI or graphic edits:</strong> AI-generated/AI-modified images, graphically enhances, compositing, retouching, or graphic enhancements are not permitted and may lead to disqualification.</p>
              <p>Graphical representations using 3D modeling software, 3D renders, Drawings, printed graphics will not be accepted as the product under this category.</p>
              <p><strong>Physical Tree Category - Accepted Formats:</strong> Sewing / Fabric crafts, Sculptures, Crafted trees / Tree models</p>
            </div>
          </div>
          
          {/* Digital Tree Category */}
          <div className="bg-slate-800/70 rounded-lg p-6">
            <h3 className="text-xl font-bold text-white mb-4">Digital Tree Category</h3>
            <div className="text-white space-y-3 text-sm">
              <p><strong>Digital Tree Category - Accepted Formats:</strong> Paintings, drawings, digital illustrations, mixed media, AI-generated or AI-enhanced images, 3D-rendered images, and graphical representations created using 3D modeling software.</p>
              <p><strong>Originality & rights:</strong> The entry must be your original work or use assets you are legally licensed to use. Do not include copyrighted logos/characters or third-party assets without written permission. You are responsible for all rights and clearances.</p>
              <p><strong>AI usage disclosure:</strong> AI-assisted work is allowed. By submitting, you warrant that no third-party rights are infringed and that any model/assets/prompts used are permitted for this purpose.</p>
              <p><strong>Compliance:</strong> Entries that breach these terms or the general competition rules may be disqualified.</p>
            </div>
          </div>
          
          {/* Kids' Tree Category */}
          <div className="bg-slate-800/70 rounded-lg p-6">
            <h3 className="text-xl font-bold text-white mb-4">Kids&apos; Tree Category</h3>
            <div className="text-white space-y-3 text-sm">
              <p><strong>No winners selected:</strong> This category will not be judged by the jury and is not eligible for popularity voting or prizes.</p>
              <p><strong>Participation recognition:</strong> Each completed submission receives one gift and a certificate of participation.</p>
              <p><strong>Single entry policy:</strong> Only one (1) entry per participant is permitted.</p>
              <p><strong>No group entries:</strong> Group/team entries are not allowed in the Kids&apos; Category.</p>
              <p><strong>Parent/Guardian responsibility:</strong> The parent/guardian is responsible for entering the child&apos;s accurate details, submission, and delivery address, including a valid phone number.</p>
              <p><strong>Delivery address required:</strong> A correct, complete delivery address and phone number are mandatory. Archalley is not liable for non-delivery, delays, misplacement, or damage arising from incorrect/incomplete details or third-party courier issues.</p>
            </div>
          </div>
          
          {/* Submission Formats */}
          <div className="bg-slate-800/70 rounded-lg p-6">
            <h3 className="text-xl font-bold text-white mb-4">Submission Formats (All Categories)</h3>
            <div className="text-white space-y-3 text-sm">
              <p>Submit files via the Archalley web portal only (no external links or email). Do not include names, logos, watermarks, or identifying marks on images or filenames.</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Key Photograph (JPG, max 5 MB)</strong> — required; whole product must be clearly visible; used for Most Popular voting.</li>
                <li><strong>Additional Photographs:</strong> 2–4 JPGs, each max 5 MB.</li>
                <li><strong>Description:</strong> 50–200 words (not required for Kids&apos; Category).</li>
              </ul>
            </div>
          </div>
          
          {/* Optional Documents */}
          <div className="bg-slate-800/70 rounded-lg p-6">
            <h3 className="text-xl font-bold text-white mb-4">Optional Documents (Physical, Digital Tree Categories Only)</h3>
            <div className="text-white space-y-3 text-sm">
              <p><strong>Optional PDF:</strong> Entrants may upload one (1) additional PDF (sketches, materials, drawings, graphics, process documentation), max 5 MB.</p>
              <p><strong>Optional Video:</strong> Entrants may upload one (1) additional video (e.g., physical tree clip, AI video, animated walkthrough), max 10 MB.</p>
              <p><strong>Submission channel:</strong> Only files uploaded via the Archalley web portal will be considered. External links (e.g., Google Drive), emails, or other reference documents/links will not be accepted for evaluation.</p>
              <p><strong>Note:</strong> These are optional and do not replace the compulsory submission requirements for each category.</p>
            </div>
          </div>
          
          {/* Group Entry */}
          <div className="bg-slate-800/70 rounded-lg p-6">
            <h3 className="text-xl font-bold text-white mb-4">Group Entry</h3>
            <div className="text-white space-y-3 text-sm">
              <p><strong>Eligibility.</strong> Under Group entry, teams, and company entries are permitted. A team may include up to ten (10) participants.</p>
              <p>If entering under a company name, the entrant represents and warrants that (i) the company has authorized participation in the competition; and (ii) the entrant has the right and authority to submit the entry and all related materials on the company&apos;s behalf. Archalley is not liable for any unauthorized submissions, fraud, or misrepresentation by the entrant or team and may, at its discretion, disqualify the entry and recover any costs or damages arising therefrom.</p>
              <p><strong>Documentation.</strong> Archalley may request supporting documents to verify company authorization and authenticity. Failure to provide satisfactory documentation may result in disqualification.</p>
              <p>By entering as a team, the entrant warrants that all team members are correctly identified and the entrant has authority to submit on the team&apos;s behalf; Archalley is not liable for unauthorized submissions, fraud, misrepresentation, or disputes, may disqualify entries and recover costs, and the entrant agrees to indemnify Archalley.</p>
            </div>
          </div>
          
          {/* Registration & Identification */}
          <div className="bg-slate-800/70 rounded-lg p-6">
            <h3 className="text-xl font-bold text-white mb-4">Registration & Identification</h3>
            <div className="text-white space-y-3 text-sm">
              <p>After your registration has been approved, you will be sent a unique identification number for your entry, which will be necessary to submit your proposal. If you haven&apos;t received a confirmation within two business days, please contact us at projects@archalley.com</p>
              <p>For kid&apos;s category the guardian is liable for entering the details of the kid & his submission & address & other details.</p>
              <p>The registration number and the name are the only forms of identification for the entries.</p>
              <p>The registration fee is non-refundable.</p>
              <p>English is to be used as the language of communication for all documents.</p>
            </div>
          </div>
          
          {/* Submission Method, Format & Deadline */}
          <div className="bg-slate-800/70 rounded-lg p-6">
            <h3 className="text-xl font-bold text-white mb-4">Submission Method, Format & Deadline</h3>
            <div className="text-white space-y-3 text-sm">
              <p>Entries must be registered and submitted only via the Archalley web portal.</p>
              <p>Entries must be submitted as JPG and must not exceed 5 MB per upload in the portal.</p>
              <p>The submission deadline is 11:59 PM IST, 24 December 2025. Submissions after this deadline will not be considered.</p>
            </div>
          </div>
          
          {/* Multiple Entries & Duplicate Products */}
          <div className="bg-slate-800/70 rounded-lg p-6">
            <h3 className="text-xl font-bold text-white mb-4">Multiple Entries & Duplicate Products</h3>
            <div className="text-white space-y-3 text-sm">
              <p>Participants are free to submit multiple entries with different products, but each entry must be registered separately.</p>
              <p>Multiple submissions by the same entrant with the same product may result in rejection of all relevant entries.</p>
              <p>Multiple submissions of the same product by different participants may result in rejection of all relevant entries.</p>
            </div>
          </div>
          
          {/* Judging & Jury Protocol */}
          <div className="bg-slate-800/70 rounded-lg p-6">
            <h3 className="text-xl font-bold text-white mb-4">Judging & Jury Protocol</h3>
            <div className="text-white space-y-3 text-sm">
              <p>Entries will be judged on their artistic merit and creative responses to the requirement to design a Christmas tree based on the theme &quot;Christmas in future.&quot;</p>
              <p>Entries will be presented anonymously for judging purposes.</p>
              <p>The judges&apos; decisions will be final and binding in all matters, and no correspondence will be entered into.</p>
              <p>The entrant/entrants must not contact the jury under any circumstances.</p>
            </div>
          </div>
          
          {/* Verification & Compliance */}
          <div className="bg-slate-800/70 rounded-lg p-6">
            <h3 className="text-xl font-bold text-white mb-4">Verification & Compliance</h3>
            <div className="text-white space-y-3 text-sm">
              <p><strong>Verification:</strong> Archalley reserves the right to request additional proof of physical fabrication (e.g., build photos, process images) and to disqualify any entry that does not conform to these terms.</p>
              <p><strong>Non-compliance:</strong> Entries that do not meet the above will be disqualified.</p>
            </div>
          </div>
          
          {/* Intellectual Property, Permissions & Indemnity */}
          <div className="bg-slate-800/70 rounded-lg p-6">
            <h3 className="text-xl font-bold text-white mb-4">Intellectual Property, Permissions & Indemnity</h3>
            <div className="text-white space-y-3 text-sm">
              <p>All copyright and any other intellectual property rights in the product photographs are vested in the entrant. The entrant confirms they have not assigned, licensed, disposed of, or otherwise encumbered any of their rights in the product.</p>
              <p>The entrant warrants that the entry does not infringe the intellectual property rights of any third party. The entrant(s) will indemnify Archalley against any claims made by third parties in respect of such infringement.</p>
              <p>By entering the competition, the entrant confirms and warrants that they have the permission of any persons pictured in the product photographs (if any); where the photograph includes a person under the age of 18, the entrant has obtained the consent of the parent or legal guardian for the photo to be published and used by Archalley as contemplated by these terms and conditions.</p>
            </div>
          </div>
          
          {/* Archalley Rights & Liability */}
          <div className="bg-slate-800/70 rounded-lg p-6">
            <h3 className="text-xl font-bold text-white mb-4">Archalley Rights & Liability</h3>
            <div className="text-white space-y-3 text-sm">
              <p>Archalley reserves the right to amend the competition schedule or cancel the competition at any point if it deems such action necessary or for reasons beyond its reasonable control. Archalley will not be liable to entrants for any such cancellation; however, entry fees will be refunded in such events.</p>
              <p>Archalley reserves the right to disqualify, refuse entry or refuse to award the prize to anyone in breach of these terms and conditions.</p>
              <p>Archalley will not be liable for any loss or damage to any entries and bears no responsibility for incomplete or delayed entries.</p>
              <p>Archalley reserves the right to inspect all the winning products physically/ verification of AI productions, if required.</p>
              <p>Winning entrants shall not object to any cropping or other minor alteration of the photographs of their product when used outside the remit of this competition.</p>
            </div>
          </div>
          
          {/* Winner Notification & Prizes */}
          <div className="bg-slate-800/70 rounded-lg p-6">
            <h3 className="text-xl font-bold text-white mb-4">Winner Notification & Prizes</h3>
            <div className="text-white space-y-3 text-sm">
              <p>Winning entrants will be notified via email or phone using the contact information provided. If Archalley is unable to contact any winner, or if the prize is not accepted within two days of being notified, the winner will be deemed to have forfeited the prize, and Archalley reserves the right to determine a new winner for that prize or cancel the prize.</p>
              <p>The winning entrants will receive prize money/gift as announced by Archalley. There will be no alternative to the prizes/gifts.</p>
            </div>
          </div>
          
          {/* License for Winning Entries */}
          <div className="bg-slate-800/70 rounded-lg p-6">
            <h3 className="text-xl font-bold text-white mb-4">License for Winning Entries</h3>
            <div className="text-white space-y-3 text-sm">
              <p>By entering the competition, each winning entrant grants Archalley, the competition sponsors, and all media partners an irrevocable, perpetual license to reproduce, enlarge, publish, or exhibit the product; the entrant&apos;s name; product images; product detail documents; and a self-picture of the entrant, mechanically or electronically, on any media worldwide (including the internet).</p>
            </div>
          </div>
          
          {/* Acceptance of Terms */}
          <div className="bg-slate-800/70 rounded-lg p-6">
            <h3 className="text-xl font-bold text-white mb-4">Acceptance of Terms</h3>
            <div className="text-white space-y-3 text-sm">
              <p>Submitting an entry to the competition indicates acceptance of these terms and conditions.</p>
            </div>
          </div>
        </div>
        
        <div className="mt-12 text-center">
          <Link
            href="/events/archalley-competition-2025/register"
            className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-lg transition-colors"
          >
            Register Now
          </Link>
        </div>
      </div>
    </div>
  );
}
