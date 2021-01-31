<?php
/**
 * @package     Joomla.Administrator
 * @subpackage  com_joomlaupdate
 *
 * @copyright   (C) 2005 Open Source Matters, Inc. <https://www.joomla.org>
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

defined('_JEXEC') or die;

use Joomla\CMS\Factory;
use Joomla\CMS\Language\Text;
use Joomla\Component\Joomlaupdate\Administrator\View\Joomlaupdate\HtmlView;

/** @var HtmlView $this */

$this->document->addScriptOptions(
		'preupdate',
		[
			'options' => [
				'serverUrl' => 'index.php?option=com_joomlaupdate&task=update.fetchextensioncompatibility',
				'selector' => '.extension-check',
				'joomlaTargetVersion' => $this->updateInfo['latest'],
				'joomlaCurrentVersion' => isset($this->updateInfo['current']) ? $this->updateInfo['current'] : JVERSION,
				'classes' => [
					'trDanger' => 'table-danger',
					'trSuccess' => 'table-success',
					'trWarning' => 'table-warning',
					'trNoInfo' => 'table-dark',
				],
			],
			'items' => $this->nonCoreExtensions
		]
);

$phpOptionsError = array_filter($this->phpOptions, function($item) {
	return $item->state === false;
});

$phpSettingsError = array_filter($this->phpSettings, function($item) {
	return $item->state !== $item->recommended;
});

?>
<h2 class="mt-3 mb-3">
	<?php echo Text::sprintf('COM_JOOMLAUPDATE_VIEW_DEFAULT_PREUPDATE_CHECK', '&#x200E;' . $this->updateInfo['latest']); ?>
</h2>
<p>
	<?php echo Text::_('COM_JOOMLAUPDATE_VIEW_DEFAULT_EXPLANATION_AND_LINK_TO_DOCS'); ?>
</p>

<div class="row">
	<div class="col-md-6">
		<fieldset class="options-form">
			<legend>
				<?php echo Text::_('COM_JOOMLAUPDATE_VIEW_DEFAULT_REQUIRED_SETTINGS'); ?>
			</legend>
			<?php if (count($phpOptionsError) === 0) : ?>
				<div style="display: grid;">
					<span class="far fa-check-circle fa-10x" aria-hidden="true" style="grid-area: none; color: green;"></span>
				</div>
			<?php else : ?>
				<table class="table" id="preupdatecheck">
					<caption class="visually-hidden">
						<?php echo Text::_('COM_JOOMLAUPDATE_PREUPDATE_CHECK_CAPTION'); ?>
					</caption>
					<thead>
						<tr>
							<th scope="col">
								<?php echo Text::_('COM_JOOMLAUPDATE_PREUPDATE_HEADING_REQUIREMENT'); ?>
							</th>
							<th scope="col">
								<?php echo Text::_('COM_JOOMLAUPDATE_PREUPDATE_HEADING_CHECKED'); ?>
							</th>
						</tr>
					</thead>
					<tbody>
					<?php foreach ($phpOptionsError as $option) : ?>
						<tr>
							<th scope="row">
								<?php echo $option->label; ?>
							</th>
							<td>
								<span class="badge bg-<?php echo $option->state ? 'success' : 'danger'; ?>">
									<?php echo Text::_($option->state ? 'JYES' : 'JNO'); ?>
									<?php if ($option->notice) : ?>
										<span class="icon-info-circle icon-white" title="<?php echo $option->notice; ?>"></span>
									<?php endif; ?>
								</span>
							</td>
						</tr>
					<?php endforeach; ?>
					</tbody>
				</table>
			<?php endif; ?>
		</fieldset>
	</div>

	<div class="col-md-6">
		<fieldset class="options-form">
			<legend>
				<?php echo Text::_('COM_JOOMLAUPDATE_VIEW_DEFAULT_RECOMMENDED_SETTINGS'); ?>
			</legend>
			<?php if (count($phpSettingsError) === 0) : ?>
			<div style="display: grid;">
				<span class="far fa-check-circle fa-10x" aria-hidden="true" style="grid-area: none; color: green;"></span>
			</div>
			<?php else : ?>
			<table class="table" id="preupdatecheckphp">
				<caption>
					<?php echo Text::_('COM_JOOMLAUPDATE_VIEW_DEFAULT_RECOMMENDED_SETTINGS_DESC'); ?>
				</caption>
				<thead>
					<tr>
						<th scope="col">
							<?php echo Text::_('COM_JOOMLAUPDATE_VIEW_DEFAULT_DIRECTIVE'); ?>
						</th>
						<th scope="col">
							<?php echo Text::_('COM_JOOMLAUPDATE_VIEW_DEFAULT_RECOMMENDED'); ?>
						</th>
						<th scope="col">
							<?php echo Text::_('COM_JOOMLAUPDATE_VIEW_DEFAULT_ACTUAL'); ?>
						</th>
					</tr>
				</thead>
				<tbody>
					<?php foreach ($phpSettingsError as $setting) : ?>
						<tr>
							<th scope="row">
								<?php echo $setting->label; ?>
							</th>
							<td>
								<?php echo Text::_($setting->recommended ? 'JON' : 'JOFF'); ?>
							</td>
							<td>
								<span class="badge bg-<?php echo ($setting->state === $setting->recommended) ? 'success' : 'warning'; ?>">
									<?php echo Text::_($setting->state ? 'JON' : 'JOFF'); ?>
								</span>
							</td>
						</tr>
					<?php endforeach; ?>
				</tbody>
			</table>
			<?php endif; ?>
		</fieldset>
	</div>
</div>
<div class="row">
	<?php if (!empty($this->nonCoreExtensions)) : ?>
		<div>
			<h3>
				<?php echo Text::_('COM_JOOMLAUPDATE_VIEW_DEFAULT_EXTENSIONS'); ?>
			</h3>
			<div id="preupdate-container"></div>
		</div>
	<?php else: ?>
	<div class="col-md-6">
		<h3>
			<?php echo Text::_('COM_JOOMLAUPDATE_VIEW_DEFAULT_EXTENSIONS'); ?>
		</h3>
		<div class="alert alert-no-items">
			<?php echo Text::_('COM_JOOMLAUPDATE_VIEW_DEFAULT_EXTENSIONS_NONE'); ?>
		</div>
	</div>
	<?php endif; ?>
</div>

<?php
/**
 * The following templates are used from the javascript
 */
?>
<template id="table-template">
	<table class="table">
		<thead class="row-fluid">
		<tr>
			<th class="exname span8">
				<?php echo Text::_('COM_JOOMLAUPDATE_VIEW_DEFAULT_EXTENSION_NAME'); ?>
			</th>
			<th class="extype span4">
				<?php echo Text::_('COM_JOOMLAUPDATE_VIEW_DEFAULT_EXTENSION_TYPE'); ?>
			</th>
			<th class="upcomp">
				<?php echo Text::_('COM_JOOMLAUPDATE_VIEW_DEFAULT_EXTENSION_UPDATE_COMPATIBLE'); ?>
			</th>
			<th class="currcomp">
				<?php echo Text::_('COM_JOOMLAUPDATE_VIEW_DEFAULT_EXTENSION_CURRENTLY_COMPATIBLE'); ?>
			</th>
			<th class="instver">
				<?php echo Text::_('COM_JOOMLAUPDATE_VIEW_DEFAULT_EXTENSION_INSTALLED_VERSION'); ?>
			</th>
		</tr>
		</thead>
		<tbody class="row-fluid">
		</tbody>
	</table>
</template>

<template id="table-row-template">
	<tr>
		<td class="exname span8"></td>
		<td class="extype span4"></td>
		<td class="extension-check upcomp"><span class="fas fa-sync fa-spin" aria-hidden="true"></span></td>
		<td class="currcomp"><span class="fas fa-sync fa-spin" aria-hidden="true"></span></td>
		<td class="instver"></td>
	</tr>
</template>
